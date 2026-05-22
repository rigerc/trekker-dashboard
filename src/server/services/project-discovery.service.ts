import { readdir } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

import {
  listRegisteredProjects,
  validateTrekkerDb,
} from '@server/services/project-registry.service';

const IGNORED_DIRS = new Set([
  '.cache',
  '.git',
  '.next',
  '.turbo',
  '.vite',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'vendor',
]);
const DEFAULT_SCAN_LIMIT = 20_000;
const MAX_SCAN_DEPTH = 1;

function shouldIgnoreDirectory(name: string): boolean {
  return IGNORED_DIRS.has(name) || (name.startsWith('.') && name !== '.trekker');
}

export interface ProjectSuggestion {
  id: string;
  name: string;
  dbPath: string;
  rootPath: string;
  registered: boolean;
}

export interface ProjectDiscoveryResult {
  root: string;
  scanned: number;
  limit: number;
  limitReached: boolean;
  suggestions: ProjectSuggestion[];
}

function stableSuggestionId(dbPath: string): string {
  const hash = new Bun.CryptoHasher('sha1').update(dbPath).digest('hex').slice(0, 12);
  return `suggestion-${hash}`;
}

function suggestionName(dbPath: string): string {
  return basename(dirname(dirname(dbPath))) || dbPath;
}

export async function discoverProjects(
  root: string,
  limit = DEFAULT_SCAN_LIMIT
): Promise<ProjectDiscoveryResult> {
  const start = resolve(root || process.cwd());
  const registeredPaths = new Set(
    (await listRegisteredProjects()).map((project) => project.dbPath)
  );
  const suggestions: ProjectSuggestion[] = [];
  let scanned = 0;
  let limitReached = false;

  async function walk(dir: string, depth = 0): Promise<void> {
    if (limitReached) return;
    scanned += 1;
    if (scanned > limit) {
      limitReached = true;
      return;
    }

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((entry) => entry.isDirectory() && entry.name === '.trekker')) {
      const dbPath = join(dir, '.trekker', 'trekker.db');
      try {
        validateTrekkerDb(dbPath);
        suggestions.push({
          id: stableSuggestionId(dbPath),
          name: suggestionName(dbPath),
          dbPath,
          rootPath: dir,
          registered: registeredPaths.has(dbPath),
        });
      } catch {
        // Ignore invalid Trekker-like folders.
      }
    }

    if (depth >= MAX_SCAN_DEPTH) {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || shouldIgnoreDirectory(entry.name)) continue;
      await walk(join(dir, entry.name), depth + 1);
      if (limitReached) return;
    }
  }

  await walk(start);

  return { root: start, scanned: Math.min(scanned, limit), limit, limitReached, suggestions };
}
