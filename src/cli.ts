#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp } from '@server/index';
import { setDashboardConfigDir } from '@server/services/dashboard-config.service';
import { autoAddLegacyProject } from '@server/services/project-registry.service';
import { Command } from 'commander';

import pkg from '../package.json';

const program = new Command();

program
  .name('trekker-dashboard')
  .description('Kanban board dashboard for Trekker issue tracker')
  .version(pkg.version)
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-r, --root <root>', 'Root directory to scan for Trekker projects', process.cwd())
  .option('--config-dir <dir>', 'Dashboard config directory')
  .action(async (options) => {
    const root = resolve(options.root);
    const legacyDbPath = resolve(root, '.trekker', 'trekker.db');

    setDashboardConfigDir(options.configDir);
    await autoAddLegacyProject(root);

    const port = parseInt(options.port, 10);
    if (Number.isNaN(port) || port <= 0) {
      console.error(`Error: Invalid port: ${options.port}`);
      process.exit(1);
    }

    const app = createApp();
    const server = Bun.serve({
      port,
      fetch: app.fetch,
    });

    console.log(`Starting Trekker Dashboard on http://localhost:${port}`);
    console.log(`Scan root: ${root}`);
    if (existsSync(legacyDbPath)) {
      console.log(`Registered current project database: ${legacyDbPath}`);
    }
    console.log('Press Ctrl+C to stop\n');

    const stopServer = () => {
      server.stop(true);
      process.exit(0);
    };

    process.on('SIGINT', stopServer);
    process.on('SIGTERM', stopServer);
  });

program.parse();
