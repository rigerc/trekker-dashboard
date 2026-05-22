import { patchDashboardConfig, readDashboardConfig } from '@server/services/dashboard-config.service';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => c.json(await readDashboardConfig()));

app.patch('/', async (c) => {
  const patch = await c.req.json();
  return c.json(await patchDashboardConfig(patch));
});

export default app;
