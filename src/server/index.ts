import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorHandler } from '@server/middleware/error-handler';
import { projectContextMiddleware } from '@server/middleware/project-context';
import archiveRoutes from '@server/routes/archive';
import commentsRoutes from '@server/routes/comments';
import dashboardConfigRoutes from '@server/routes/dashboard-config';
import dependenciesRoutes from '@server/routes/dependencies';
import epicsRoutes from '@server/routes/epics';
import eventsRoutes from '@server/routes/events';
import historyRoutes from '@server/routes/history';
import listRoutes from '@server/routes/list';
import projectRoutes from '@server/routes/project';
import projectsRoutes from '@server/routes/projects';
import searchRoutes from '@server/routes/search';
import tasksRoutes from '@server/routes/tasks';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';

export function createApp() {
  const app = new Hono();

  // CORS for development
  app.use(
    '/api/*',
    cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
    })
  );

  // Mount global dashboard routes
  app.route('/api/dashboard-config', dashboardConfigRoutes);
  app.route('/api/projects', projectsRoutes);

  // Mount project-scoped API routes
  for (const path of [
    '/api/tasks',
    '/api/epics',
    '/api/comments',
    '/api/dependencies',
    '/api/project',
    '/api/events',
    '/api/search',
    '/api/list',
    '/api/history',
    '/api/bulk-archive-completed',
  ]) {
    app.use(path, projectContextMiddleware);
    app.use(`${path}/*`, projectContextMiddleware);
  }

  app.route('/api/tasks', tasksRoutes);
  app.route('/api/epics', epicsRoutes);
  app.route('/api/comments', commentsRoutes);
  app.route('/api/dependencies', dependenciesRoutes);
  app.route('/api/project', projectRoutes);
  app.route('/api/events', eventsRoutes);
  app.route('/api/search', searchRoutes);
  app.route('/api/list', listRoutes);
  app.route('/api/history', historyRoutes);
  app.route('/api/bulk-archive-completed', archiveRoutes);

  // Centralized error handling
  app.onError(errorHandler);

  // Serve static files in production
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const distClientPath = resolve(scriptDir, '../../dist/client');

  if (existsSync(distClientPath)) {
    const indexPath = resolve(distClientPath, 'index.html');

    const serveIndex = async () => {
      if (existsSync(indexPath)) {
        const file = Bun.file(indexPath);
        return new Response(file, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      return new Response('Not Found', { status: 404 });
    };

    // SPA routes - serve index.html for client-side routing
    app.get('/', async () => serveIndex());
    app.get('/list', async () => serveIndex());
    app.get('/graph', async () => serveIndex());
    app.get('/history', async () => serveIndex());
    app.get('/projects/:projectId/*', async () => serveIndex());

    // Serve static files (JS, CSS, images, etc.)
    // Use relative path with forward slashes for Windows compatibility
    const staticRoot = relative(process.cwd(), distClientPath).split('\\').join('/');
    app.use(
      '/*',
      serveStatic({
        root: staticRoot,
      })
    );
  }

  return app;
}

// Export for CLI to use
const app = createApp();

if (import.meta.main) {
  const port = parseInt(process.env.PORT || '3001', 10);
  console.log(`Server starting on http://localhost:${port}`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
