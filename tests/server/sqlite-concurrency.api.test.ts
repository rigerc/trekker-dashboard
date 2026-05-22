import { getSqliteInstance, runWithDbPath } from '@server/lib/db';
import * as eventService from '@server/services/event.service';
import { afterEach, describe, expect, it } from 'bun:test';

import {
  cleanupApiTestContexts,
  createApiTestContext,
  JSON_HEADERS,
  type ProjectResponse,
  type TaskResponse,
} from './api-test-helpers';

const cleanupDirs: string[] = [];

function ignoreStreamCancelError(): null {
  return null;
}

afterEach(() => {
  cleanupApiTestContexts(cleanupDirs);
});

describe('sqlite connection handling', () => {
  it('configures WAL mode and a busy timeout when opening a database', async () => {
    const context = createApiTestContext(cleanupDirs);

    const project = await context.requestJson<ProjectResponse>('/api/project');
    expect(project.status).toBe(200);

    const sqlite = runWithDbPath(context.dbPath, () => getSqliteInstance());
    const journalMode = sqlite?.query('PRAGMA journal_mode').get() as
      | { journal_mode: string }
      | undefined;
    const busyTimeout = sqlite?.query('PRAGMA busy_timeout').get() as
      | { timeout: number }
      | undefined;

    expect(journalMode?.journal_mode).toBe('wal');
    expect(busyTimeout?.timeout).toBeGreaterThan(0);
  });

  it('generates unique task IDs for concurrent creates', async () => {
    const context = createApiTestContext(cleanupDirs);

    const creates = await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        context.requestJson<TaskResponse>('/api/tasks', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ title: `Concurrent task ${index}` }),
        })
      )
    );

    for (const create of creates) {
      expect(create.status).toBe(201);
    }

    const ids = creates.map((create) => create.body.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps event snapshots isolated per database', async () => {
    const firstContext = createApiTestContext(cleanupDirs);
    const secondContext = createApiTestContext(cleanupDirs);

    await firstContext.createTask({ title: 'Only in the first database' });

    await runWithDbPath(firstContext.dbPath, () => eventService.initialize());
    const firstChanges = await runWithDbPath(firstContext.dbPath, () => eventService.getChanges());
    expect(firstChanges).toHaveLength(0);

    await runWithDbPath(secondContext.dbPath, () => eventService.initialize());
    const secondChanges = await runWithDbPath(secondContext.dbPath, () =>
      eventService.getChanges()
    );
    expect(secondChanges).toHaveLength(0);
  });

  it('allows writes while the frontend event stream is active', async () => {
    const context = createApiTestContext(cleanupDirs);
    const abortController = new AbortController();

    const eventsResponse = await context.request('/api/events', {
      signal: abortController.signal,
    });
    expect(eventsResponse.status).toBe(200);

    const createTask = await context.requestJson<TaskResponse>('/api/tasks', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: 'Write while event stream is active' }),
    });

    expect(createTask.status).toBe(201);
    expect(createTask.body.title).toBe('Write while event stream is active');

    abortController.abort();
    await eventsResponse.body?.cancel().catch(ignoreStreamCancelError);
  });
});
