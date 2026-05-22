import { getCurrentDbPath, runWithDbPath } from '@server/lib/db';
import { getOpenProject, getProjectById } from '@server/services/project-registry.service';
import type { MiddlewareHandler } from 'hono';

export const projectContextMiddleware: MiddlewareHandler = async (c, next) => {
  const projectId = c.req.header('X-Trekker-Project-Id') ?? c.req.query('projectId');
  let project;
  if (projectId) {
    project = await getProjectById(projectId);
  } else {
    project = await getOpenProject();
  }

  if (!project) {
    try {
      getCurrentDbPath();
      return await next();
    } catch {
      return c.json({ error: 'No Trekker project is registered', code: 'NO_PROJECT' }, 409);
    }
  }

  if (projectId && project.id !== projectId) {
    return c.json({ error: `Project not found: ${projectId}`, code: 'PROJECT_NOT_FOUND' }, 404);
  }

  return await runWithDbPath(project.dbPath, next);
};
