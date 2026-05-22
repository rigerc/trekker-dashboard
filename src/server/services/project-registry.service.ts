import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

import {
  type DashboardProject,
  readDashboardConfig,
  updateDashboardConfig,
} from '@server/services/dashboard-config.service';
import { Database } from 'bun:sqlite';

export interface AddProjectInput {
  dbPath: string;
  name?: string;
  open?: boolean;
}

function stableProjectId(dbPath: string): string {
  const hash = new Bun.CryptoHasher('sha1').update(dbPath).digest('hex').slice(0, 12);
  return `project-${hash}`;
}

function inferProjectName(dbPath: string): string {
  const projectDir = dirname(dirname(dbPath));
  return basename(projectDir) || dbPath;
}

export function normalizeDbPath(path: string): string {
  const resolved = resolve(path);
  if (resolved.endsWith('/.trekker/trekker.db') || resolved.endsWith('\\.trekker\\trekker.db')) {
    return resolved;
  }

  return resolve(resolved, '.trekker', 'trekker.db');
}

export function validateTrekkerDb(dbPath: string): void {
  if (!existsSync(dbPath)) {
    throw new Error(`Trekker database not found: ${dbPath}`);
  }

  const sqlite = new Database(dbPath);
  try {
    const row = sqlite
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'")
      .get();
    if (!row) {
      throw new Error(`Not a Trekker database: ${dbPath}`);
    }
  } finally {
    sqlite.close();
  }
}

export async function listRegisteredProjects(): Promise<DashboardProject[]> {
  return (await readDashboardConfig()).projects;
}

export async function getOpenProject(): Promise<DashboardProject | null> {
  const config = await readDashboardConfig();
  return config.projects.find((project) => project.id === config.openProjectId) ?? config.projects[0] ?? null;
}

export async function getProjectById(id: string): Promise<DashboardProject | null> {
  return (await readDashboardConfig()).projects.find((project) => project.id === id) ?? null;
}

export async function addProject(input: AddProjectInput): Promise<DashboardProject> {
  const dbPath = normalizeDbPath(input.dbPath);
  validateTrekkerDb(dbPath);
  const id = stableProjectId(dbPath);
  const now = new Date().toISOString();
  let added!: DashboardProject;

  await updateDashboardConfig((config) => {
    if (config.projects.some((project) => project.dbPath === dbPath)) {
      throw new Error(`Project is already registered: ${dbPath}`);
    }

    added = {
      id,
      name: input.name?.trim() || inferProjectName(dbPath),
      dbPath,
      addedAt: now,
    };

    let openProjectId = added.id;
    if (input.open === false) {
      openProjectId = config.openProjectId ?? added.id;
    } else {
      added.lastOpenedAt = now;
    }

    return {
      ...config,
      openProjectId,
      projects: [...config.projects, added],
    };
  });

  return added;
}

export async function removeProject(id: string): Promise<void> {
  await updateDashboardConfig((config) => {
    const projects = config.projects.filter((project) => project.id !== id);
    if (projects.length === config.projects.length) {
      throw new Error(`Project not found: ${id}`);
    }

    return {
      ...config,
      projects,
      openProjectId: getOpenProjectIdAfterRemoval(config.openProjectId, id, projects),
    };
  });
}

export async function openProject(id: string): Promise<DashboardProject> {
  let opened: DashboardProject | undefined;
  const now = new Date().toISOString();
  await updateDashboardConfig((config) => {
    const projects = config.projects.map((project) => {
      if (project.id !== id) return project;
      opened = { ...project, lastOpenedAt: now };
      return opened;
    });

    if (!opened) {
      throw new Error(`Project not found: ${id}`);
    }

    return { ...config, openProjectId: id, projects };
  });

  if (!opened) {
    throw new Error(`Project not found: ${id}`);
  }

  return opened;
}

function getOpenProjectIdAfterRemoval(
  currentOpenProjectId: string | null,
  removedProjectId: string,
  projects: DashboardProject[]
): string | null {
  if (currentOpenProjectId !== removedProjectId) {
    return currentOpenProjectId;
  }

  return projects[0]?.id ?? null;
}

export async function autoAddLegacyProject(cwd = process.cwd()): Promise<DashboardProject | null> {
  const dbPath = normalizeDbPath(cwd);
  if (!existsSync(dbPath)) {
    return null;
  }

  const config = await readDashboardConfig();
  const existing = config.projects.find((project) => project.dbPath === dbPath);
  if (existing) {
    return existing;
  }

  return addProject({ dbPath, open: config.openProjectId === null });
}
