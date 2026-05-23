#!/usr/bin/env bun
import { Database } from 'bun:sqlite';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.argv[2] ? resolve(process.argv[2]) : resolve(process.cwd());
const dbPath = resolve(root, '.trekker', 'trekker.db');

async function seed() {
  await mkdir(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath, { create: true });

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS project_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority INTEGER NOT NULL DEFAULT 2,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      epic_id TEXT,
      parent_task_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'todo',
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      depends_on_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS id_counters (
      entity_type TEXT PRIMARY KEY,
      counter INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      snapshot TEXT,
      changes TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Seed project config defaults
  const configDefaults = [
    ['issue_prefix', 'TREK'],
    ['epic_prefix', 'EPIC'],
    ['comment_prefix', 'CMT'],
  ];
  for (const [key, value] of configDefaults) {
    db.query('INSERT OR IGNORE INTO project_config (key, value) VALUES (?, ?)').run(key, value);
  }

  // Seed ID counters
  const counterDefaults = [
    ['task', 0],
    ['epic', 0],
    ['comment', 0],
  ];
  for (const [entityType, counter] of counterDefaults) {
    db.query('INSERT OR IGNORE INTO id_counters (entity_type, counter) VALUES (?, ?)').run(entityType, counter);
  }

  const now = Date.now();
  const projectId = 'project-sample-trek';

  // Seed project
  db.query('INSERT OR IGNORE INTO projects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .run(projectId, 'Sample Trek Project', now, now);

  // Seed epics
  const epicsData = [
    { id: 'EPIC-1', title: 'Foundation Setup', description: 'Set up the core infrastructure and tooling for the project.', status: 'completed', priority: 3 },
    { id: 'EPIC-2', title: 'User Authentication', description: 'Implement user login, registration, and session management.', status: 'in_progress', priority: 3 },
    { id: 'EPIC-3', title: 'Dashboard UI', description: 'Build the main dashboard with widgets and data visualization.', status: 'todo', priority: 2 },
    { id: 'EPIC-4', title: 'API Integration', description: 'Connect to third-party APIs and handle data synchronization.', status: 'todo', priority: 2 },
  ];

  for (const epic of epicsData) {
    db.query(`
      INSERT OR IGNORE INTO epics (id, project_id, title, description, status, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(epic.id, projectId, epic.title, epic.description, epic.status, epic.priority, now, now);
  }

  // Update epic counter
  db.query('UPDATE id_counters SET counter = ? WHERE entity_type = ?').run(4, 'epic');

  // Seed tasks
  const tasksData = [
    // EPIC-1: Foundation Setup (completed)
    { id: 'TREK-1', epicId: 'EPIC-1', title: 'Initialize repository', description: 'Set up Git repo with README and .gitignore.', status: 'completed', priority: 2, tags: 'setup,git' },
    { id: 'TREK-2', epicId: 'EPIC-1', title: 'Configure build pipeline', description: 'Set up CI/CD with GitHub Actions.', status: 'completed', priority: 3, tags: 'ci,devops' },
    { id: 'TREK-3', epicId: 'EPIC-1', title: 'Set up linting and formatting', description: 'Configure ESLint, Prettier, and pre-commit hooks.', status: 'completed', priority: 2, tags: 'tooling' },

    // EPIC-2: User Authentication (in_progress)
    { id: 'TREK-4', epicId: 'EPIC-2', title: 'Design auth flow', description: 'Create wireframes for login, signup, and password reset.', status: 'completed', priority: 2, tags: 'design,ux' },
    { id: 'TREK-5', epicId: 'EPIC-2', title: 'Implement login page', description: 'Build the login form with email and password fields.', status: 'in_progress', priority: 3, tags: 'frontend,auth' },
    { id: 'TREK-6', epicId: 'EPIC-2', title: 'Implement signup page', description: 'Build the registration form with validation.', status: 'todo', priority: 3, tags: 'frontend,auth' },
    { id: 'TREK-7', epicId: 'EPIC-2', title: 'Set up session management', description: 'Configure JWT or session-based auth on the backend.', status: 'todo', priority: 3, tags: 'backend,auth' },

    // EPIC-3: Dashboard UI (todo)
    { id: 'TREK-8', epicId: 'EPIC-3', title: 'Design dashboard layout', description: 'Create mockups for the main dashboard view.', status: 'todo', priority: 2, tags: 'design,ui' },
    { id: 'TREK-9', epicId: 'EPIC-3', title: 'Build sidebar navigation', description: 'Implement collapsible sidebar with menu items.', status: 'todo', priority: 2, tags: 'frontend,ui' },
    { id: 'TREK-10', epicId: 'EPIC-3', title: 'Create widget components', description: 'Build reusable widget cards for the dashboard.', status: 'todo', priority: 1, tags: 'frontend,components' },

    // EPIC-4: API Integration (todo)
    { id: 'TREK-11', epicId: 'EPIC-4', title: 'Research API providers', description: 'Evaluate and select third-party APIs to integrate.', status: 'todo', priority: 2, tags: 'research,api' },
    { id: 'TREK-12', epicId: 'EPIC-4', title: 'Set up API client', description: 'Create a reusable HTTP client with error handling.', status: 'todo', priority: 2, tags: 'backend,api' },
  ];

  for (const task of tasksData) {
    db.query(`
      INSERT OR IGNORE INTO tasks (id, project_id, epic_id, title, description, status, priority, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(task.id, projectId, task.epicId, task.title, task.description, task.status, task.priority, task.tags, now, now);
  }

  // Update task counter
  db.query('UPDATE id_counters SET counter = ? WHERE entity_type = ?').run(12, 'task');

  // Seed comments
  const commentsData = [
    { id: 'CMT-1', taskId: 'TREK-5', author: 'Alice', content: 'Should we support OAuth providers like Google and GitHub?' },
    { id: 'CMT-2', taskId: 'TREK-5', author: 'Bob', content: 'Yes, let\'s add Google OAuth in the next sprint.' },
    { id: 'CMT-3', taskId: 'TREK-2', author: 'Charlie', content: 'CI pipeline is green. Ready to merge.' },
    { id: 'CMT-4', taskId: 'TREK-8', author: 'Diana', content: 'I\'ll share the Figma mockups by Friday.' },
    { id: 'CMT-5', taskId: 'TREK-11', author: 'Eve', content: 'Stripe and PayPal APIs look promising for payments.' },
  ];

  for (const comment of commentsData) {
    db.query(`
      INSERT OR IGNORE INTO comments (id, task_id, author, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(comment.id, comment.taskId, comment.author, comment.content, now, now);
  }

  // Update comment counter
  db.query('UPDATE id_counters SET counter = ? WHERE entity_type = ?').run(5, 'comment');

  // Seed dependencies
  const dependenciesData = [
    // TREK-5 (login page) depends on TREK-4 (auth flow design)
    { id: 'dep-1', taskId: 'TREK-5', dependsOnId: 'TREK-4' },
    // TREK-6 (signup page) depends on TREK-5 (login page)
    { id: 'dep-2', taskId: 'TREK-6', dependsOnId: 'TREK-5' },
    // TREK-7 (session management) depends on TREK-5 (login page)
    { id: 'dep-3', taskId: 'TREK-7', dependsOnId: 'TREK-5' },
    // TREK-9 (sidebar) depends on TREK-8 (dashboard layout)
    { id: 'dep-4', taskId: 'TREK-9', dependsOnId: 'TREK-8' },
    // TREK-10 (widgets) depends on TREK-9 (sidebar)
    { id: 'dep-5', taskId: 'TREK-10', dependsOnId: 'TREK-9' },
    // TREK-12 (API client) depends on TREK-11 (research APIs)
    { id: 'dep-6', taskId: 'TREK-12', dependsOnId: 'TREK-11' },
  ];

  for (const dep of dependenciesData) {
    db.query(`
      INSERT OR IGNORE INTO dependencies (id, task_id, depends_on_id, created_at)
      VALUES (?, ?, ?, ?)
    `).run(dep.id, dep.taskId, dep.dependsOnId, now);
  }

  db.close();

  console.log(`✅ Seeded sample Trek database at: ${dbPath}`);
  console.log(`   Project: Sample Trek Project`);
  console.log(`   Epics: ${epicsData.length}`);
  console.log(`   Tasks: ${tasksData.length}`);
  console.log(`   Comments: ${commentsData.length}`);
  console.log(`   Dependencies: ${dependenciesData.length}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
