import { epics, getDb, tasks } from '@server/lib/db';
import { eq } from 'drizzle-orm';

interface BulkArchiveResult {
  tasksArchived: number;
  epicsArchived: number;
}

export async function bulkArchiveCompleted(): Promise<BulkArchiveResult> {
  const db = getDb();
  const now = new Date();

  const archivedTasks = await db
    .update(tasks)
    .set({ status: 'archived', updatedAt: now })
    .where(eq(tasks.status, 'completed'))
    .returning({ id: tasks.id });

  const archivedEpics = await db
    .update(epics)
    .set({ status: 'archived', updatedAt: now })
    .where(eq(epics.status, 'completed'))
    .returning({ id: epics.id });

  return {
    tasksArchived: archivedTasks.length,
    epicsArchived: archivedEpics.length,
  };
}
