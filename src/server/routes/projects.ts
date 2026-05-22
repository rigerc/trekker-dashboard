import { readDashboardConfig } from '@server/services/dashboard-config.service';
import { discoverProjects } from '@server/services/project-discovery.service';
import {
  addProject,
  getOpenProject,
  listRegisteredProjects,
  openProject,
  removeProject,
} from '@server/services/project-registry.service';
import type { Context } from 'hono';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) =>
  c.json({ projects: await listRegisteredProjects(), openProject: await getOpenProject() })
);

async function handleDiscoverProjects(c: Context) {
  const root = c.req.query('root') ?? process.cwd();
  const limitParam = c.req.query('limit');
  let limit;
  if (limitParam) {
    limit = Number.parseInt(limitParam, 10);
  }
  return c.json(await discoverProjects(root, limit));
}

app.get('/discovered', handleDiscoverProjects);

app.post('/', async (c) => {
  const body = await c.req.json();
  await addProject({ dbPath: body.dbPath ?? body.path, name: body.name, open: body.open });
  return c.json(await readDashboardConfig(), 201);
});

app.delete('/:id', async (c) => {
  await removeProject(c.req.param('id'));
  return c.json(await readDashboardConfig());
});

app.patch('/:id/open', async (c) => {
  await openProject(c.req.param('id'));
  return c.json(await readDashboardConfig());
});

export default app;
