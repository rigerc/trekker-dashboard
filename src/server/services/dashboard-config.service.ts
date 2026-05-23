import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { z } from 'zod';

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  dbPath: z.string().min(1),
  addedAt: z.string().min(1),
  lastOpenedAt: z.string().min(1).optional(),
});

const preferencesSchema = z.object({
  cardDensity: z.enum(['compact', 'normal', 'comfortable']).optional(),
  defaultPage: z.enum(['/', '/list', '/graph', '/history']).optional(),
  defaultGraphView: z.enum(['list', 'graph']).optional(),
  defaultHistoryView: z.enum(['all', 'tasks', 'epics', 'comments', 'dependencies']).optional(),
  listPageSize: z.number().int().positive().optional(),
  listDefaultSort: z.string().optional(),
  groupRelatedWork: z.boolean().optional(),
});

const dashboardConfigSchema = z.object({
  version: z.literal(1),
  openProjectId: z.string().min(1).nullable(),
  scanRoots: z.array(z.string()),
  projects: z.array(projectSchema),
  preferences: preferencesSchema.optional(),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    density: z.enum(['comfortable', 'compact']).optional(),
  }),
});

export type DashboardProject = z.infer<typeof projectSchema>;
export type DashboardConfig = z.infer<typeof dashboardConfigSchema>;
export type DashboardConfigPatch = Partial<Pick<DashboardConfig, 'openProjectId' | 'scanRoots'>> & {
  settings?: Partial<DashboardConfig['settings']>;
  preferences?: Partial<DashboardConfig['preferences']>;
};

const DEFAULT_CONFIG: DashboardConfig = {
  version: 1,
  openProjectId: null,
  scanRoots: [process.cwd()],
  projects: [],
  preferences: {},
  settings: {},
};

let configDirOverride: string | undefined;
let updateQueue = Promise.resolve();

export function setDashboardConfigDir(configDir: string | undefined): void {
  configDirOverride = undefined;
  if (configDir) {
    configDirOverride = resolve(configDir);
  }
}

export function getDashboardConfigDir(): string {
  if (configDirOverride) {
    return configDirOverride;
  }
  if (process.env.TREKKER_DASHBOARD_CONFIG_DIR) {
    return process.env.TREKKER_DASHBOARD_CONFIG_DIR;
  }

  return join(homedir(), '.config', 'trekker-dashboard');
}

function getConfigPath(): string {
  return join(getDashboardConfigDir(), 'config.json');
}

function migrateConfig(input: unknown): DashboardConfig {
  let candidate = {};
  if (typeof input === 'object' && input !== null) {
    candidate = input;
  }
  const parsed = dashboardConfigSchema.safeParse({ ...DEFAULT_CONFIG, ...candidate });
  if (!parsed.success) {
    return { ...DEFAULT_CONFIG };
  }

  const projects = dedupeProjects(parsed.data.projects);
  const openProjectExists = projects.some((project) => project.id === parsed.data.openProjectId);
  return {
    ...parsed.data,
    openProjectId: getValidOpenProjectId(openProjectExists, parsed.data.openProjectId, projects),
    projects,
  };
}

function getValidOpenProjectId(
  openProjectExists: boolean,
  openProjectId: string | null,
  projects: DashboardProject[]
): string | null {
  if (openProjectExists) {
    return openProjectId;
  }

  return projects[0]?.id ?? null;
}

function dedupeProjects(projects: DashboardProject[]): DashboardProject[] {
  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();
  const result: DashboardProject[] = [];

  for (const project of projects) {
    const dbPath = resolve(project.dbPath);
    if (seenIds.has(project.id) || seenPaths.has(dbPath)) {
      continue;
    }
    seenIds.add(project.id);
    seenPaths.add(dbPath);
    result.push({ ...project, dbPath });
  }

  return result;
}

export async function readDashboardConfig(): Promise<DashboardConfig> {
  const configPath = getConfigPath();
  try {
    const raw = await readFile(configPath, 'utf8');
    return migrateConfig(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_CONFIG };
    }

    const brokenPath = `${configPath}.broken-${Date.now()}`;
    try {
      await rename(configPath, brokenPath);
    } catch {
      // Ignore recovery rename failures and recreate the config below.
    }
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeDashboardConfig(config: DashboardConfig): Promise<DashboardConfig> {
  const normalized = migrateConfig(config);
  const configPath = getConfigPath();
  await mkdir(dirname(configPath), { recursive: true });
  const tempPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  await rename(tempPath, configPath);
  return normalized;
}

export function updateDashboardConfig(
  updater: (config: DashboardConfig) => DashboardConfig | Promise<DashboardConfig>
): Promise<DashboardConfig> {
  const next = updateQueue.then(async () => {
    const config = await readDashboardConfig();
    return writeDashboardConfig(await updater(config));
  });
  updateQueue = next.then(
    () => null,
    () => null
  );
  return next;
}

export async function patchDashboardConfig(patch: DashboardConfigPatch): Promise<DashboardConfig> {
  return updateDashboardConfig((config) => {
    let openProjectId = config.openProjectId;
    if (patch.openProjectId !== undefined) {
      openProjectId = patch.openProjectId;
    }

    return {
      ...config,
      openProjectId,
      scanRoots: patch.scanRoots ?? config.scanRoots,
      preferences: { ...config.preferences, ...patch.preferences },
      settings: { ...config.settings, ...patch.settings },
    };
  });
}
