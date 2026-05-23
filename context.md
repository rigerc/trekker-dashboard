# Code Context: Tag Support in trekker-dashboard

## Files Retrieved

### Trekker CLI (docs/context/trekker/)
1. `docs/context/trekker/src/types/index.ts` (lines 61-68, 102-118) - **Task type definition with `tags: string | null`**, `CreateTaskInput` and `UpdateTaskInput` with optional `tags?: string`
2. `docs/context/trekker/src/types/options.ts` (lines 11, 25) - CLI option types: `TaskCreateOptions.tags` and `TaskUpdateOptions.tags` as optional strings
3. `docs/context/trekker/src/db/schema.ts` (line 40) - Drizzle schema: `tags: text('tags')` on tasks table
4. `docs/context/trekker/src/db/client.ts` (lines 105, 358-386) - Raw SQL: `tags TEXT` column; history triggers track tag changes
5. `docs/context/trekker/src/commands/task.ts` (lines 28, 39, 98, 117-118) - CLI commands: `--tags <tags>` for create and update
6. `docs/context/trekker/src/services/task.ts` (lines 50, 185-186) - Service: stores tags as-is on create, updates tags when provided
7. `docs/context/trekker/src/utils/output.ts` (lines 110-111, 182-191) - Output formatting: displays `Tags: ${task.tags}` in task details and inline in lists
8. `docs/context/trekker/src/commands/seed.ts` (lines 48-123) - Seed data with example tags like `'backend,security'`, `'frontend,ui'`

### Server API (src/server/)
9. `src/server/lib/schema.ts` (line 38) - Server Drizzle schema: `tags: text('tags')` on tasks table
10. `src/server/routes/tasks.ts` (lines 19, 28) - API validation: `tags: z.string().nullish()` on create, `tags: z.string().nullable().optional()` on update
11. `src/server/services/task.service.ts` (lines 20, 29, 117, 142) - Service: `tags?: string | null` in interfaces; stored as `input.tags || null`; updated if `input.tags !== undefined`
12. `src/server/lib/query.ts` (full file) - Query parsing utilities: `parseCsvQuery`, `parseNumberCsvQuery` (no tag-specific parsing)
13. `src/server/routes/list.ts` (full file) - List endpoint: filters by type/status/priority but **NO tag filtering**
14. `src/server/routes/search.ts` (full file) - Search endpoint: uses FTS5 search_index which does **NOT include tags** in indexed content

### Frontend Client (src/client/)
15. `src/client/types/index.ts` (line 34) - Frontend Task type: `tags: string | null`
16. `src/client/components/kanban/task-card.tsx` (lines 196-201) - Kanban card: renders tags by splitting `task.tags` on comma, displays each as a `Badge` variant="outline"
17. `src/client/components/task-detail/sidebar/task-tags-row.tsx` (full file) - **Dedicated tag display component**: takes `tags: string[]`, renders each as `Badge` variant="secondary"
18. `src/client/components/task-detail/sidebar/details-section.tsx` (lines 30-33, 59) - Detail sidebar: splits `task.tags` by comma, trims, filters empty, passes to `TaskTagsRow`
19. `src/client/components/task-detail/task-edit.tsx` (lines 61, 162-167) - Edit modal: text input bound to `tags` form field
20. `src/client/components/task-detail/schema.ts` (line 8) - Form schema: `tags: z.string()`
21. `src/client/components/task-detail/form-helpers.ts` (lines 10, 29, 39) - Form helpers: `tags?: string | null` in payload; defaults to `''` or `task.tags ?? ''`
22. `src/client/components/task-detail/use-task-form.ts` (line 57) - Form submission: `tags: data.tags.trim() || null`
23. `src/client/components/create-modal/create-form.tsx` (lines 158-162) - Create modal: text input with placeholder "bug, frontend..."
24. `src/client/components/create-modal/schema.ts` (line 11) - Create schema: `tags: z.string()`
25. `src/client/components/create-modal/use-create-form.ts` (lines 46, 58) - Create submission: `tags: data.tags.trim() || null` for both task and subtask
26. `src/client/components/create-modal/create-form.utils.ts` (line 28) - Default values: `tags: ''`
27. `src/client/hooks/use-list.ts` (lines 29-36, 41-50) - List hook: `ListFilters` interface has **NO tag field**; fetch does not send tag params
28. `src/client/pages/list-page-filters.tsx` (full file) - List filters: type/status/priority/sort only, **no tag filter**

## Key Code

### Tag Data Model (stored as comma-separated string)

**CLI type** (`docs/context/trekker/src/types/index.ts:61-68`):
```typescript
export interface Task {
  id: string;
  projectId: string;
  epicId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  tags: string | null;  // <-- comma-separated string
  createdAt: Date;
  updatedAt: Date;
}
```

**Database schema** (`src/server/lib/schema.ts:30-42`):
```typescript
export const tasks = sqliteTable('tasks', {
  // ... other fields
  tags: text('tags'),  // plain TEXT column, no index
  // ...
});
```

### CLI Tag Commands (`docs/context/trekker/src/commands/task.ts`):
```typescript
// Create with tags
taskCommand.command('create')
  .option('--tags <tags>', 'Comma-separated tags')
  // ...

// Update tags
taskCommand.command('update <task-id>')
  .option('--tags <tags>', 'New tags (comma-separated)')
  // ...
  if (options.tags !== undefined) {
    updateInput.tags = options.tags;
  }
```

### API Routes (`src/server/routes/tasks.ts`):
```typescript
const createTaskSchema = z.object({
  // ...
  tags: z.string().nullish(),
});

const updateTaskSchema = z.object({
  // ...
  tags: z.string().nullable().optional(),
});

// Endpoints:
// GET    /api/tasks       - list all tasks (no tag filter)
// POST   /api/tasks       - create task (accepts tags)
// GET    /api/tasks/:id   - get single task
// PUT    /api/tasks/:id   - update task (accepts tags)
// DELETE /api/tasks/:id   - delete task
```

### Frontend Tag Display - Kanban Card (`src/client/components/kanban/task-card.tsx:196-201`):
```tsx
{task.tags && (
  <div className={cn('flex flex-wrap gap-1.5', sectionGapLarge[cardDensity])}>
    {task.tags.split(',').map((tag) => (
      <Badge key={tag} variant="outline" className="text-[10px] font-normal">
        {tag.trim()}
      </Badge>
    ))}
  </div>
)}
```

### Frontend Tag Display - Detail Sidebar (`src/client/components/task-detail/sidebar/details-section.tsx:30-33`):
```tsx
const tags =
  task.tags
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean) ?? [];
// ...
<TaskTagsRow tags={tags} />
```

### Frontend Tag Editing - Create Form (`src/client/components/create-modal/create-form.tsx:158-162`):
```tsx
<Input
  {...register('tags')}
  placeholder="bug, frontend..."
  className="w-48 h-9 border-none shadow-none bg-transparent px-2.5 text-sm text-right ..."
/>
```

### Frontend Tag Editing - Edit Form (`src/client/components/task-detail/task-edit.tsx:162-167`):
```tsx
<Input
  value={tags}
  onChange={(e) => setValue('tags', e.target.value)}
  placeholder="bug, frontend..."
  className="w-48 h-9 border-none shadow-none bg-transparent px-2.5 text-sm text-right ..."
/>
```

### Tag Submission Payload (`src/client/components/create-modal/use-create-form.ts:43-47`):
```typescript
function toCreateTaskPayload(data: CreateFormValues) {
  return {
    // ...
    tags: data.tags.trim() || null,
    // ...
  };
}
```

## Architecture

### How Tags Work Today

1. **Storage**: Tags are stored as a single TEXT column (`tags`) on the `tasks` table. Multiple tags are stored as a comma-separated string (e.g., `"backend,security"`). No separate tag table or junction table exists.

2. **CLI Support**: Full CRUD support:
   - `trekker task create --tags "bug,frontend"` - create with tags
   - `trekker task update <id> --tags "new,tags"` - replace all tags
   - `trekker task show <id>` - displays tags in output
   - Tags are included in history/event triggers for auditing

3. **Server API**:
   - `POST /api/tasks` accepts `tags` (string|null) in JSON body
   - `PUT /api/tasks/:id` accepts `tags` (string|null) in JSON body
   - **No dedicated tag endpoints** (no GET/POST/DELETE for individual tags)
   - **No tag filtering** on `/api/list` or `/api/search`
   - The FTS5 search index does **NOT** include tags

4. **Frontend Display**:
   - **Kanban cards**: Tags shown as small outline badges, parsed by splitting on `,`
   - **Task detail sidebar**: `TaskTagsRow` component shows tags as secondary badges
   - **List page**: Tags are **NOT displayed** in the list view

5. **Frontend Editing**:
   - **Create modal**: Single text input for comma-separated tags (shown for task and subtask, not epic)
   - **Edit modal**: Single text input for comma-separated tags

6. **What's Missing**:
   - No tag filtering on list page or kanban
   - No tag filtering on search
   - No tag autocomplete/suggestions
   - No tag color coding or custom styling
   - No tag management (no way to see all tags, rename, delete)
   - Tags not included in FTS search index
   - No tag column in list view
   - No way to filter by tag in any view

## Start Here

For **adding tag features**, start with:

1. **`src/server/routes/tasks.ts`** - Add tag to API schemas if changes needed
2. **`src/server/routes/list.ts`** - Add tag filtering support (new query param)
3. **`src/server/lib/db.ts`** + **`src/server/lib/schema.ts`** - Consider if tags need their own table or index
4. **`src/client/hooks/use-list.ts`** - Add `tags?: string[]` to `ListFilters`
5. **`src/client/pages/list-page-filters.tsx`** - Add tag filter UI
6. **`src/client/components/kanban/task-card.tsx`** - Existing tag display; may need enhancements
7. **`src/client/components/task-detail/sidebar/task-tags-row.tsx`** - Tag display component; consider making tags clickable for filtering

## Supervisor coordination

No blocking decisions identified. The tag implementation is straightforward - comma-separated strings stored in a single TEXT column. All existing patterns (create, update, display) are in place. The main gaps are filtering, search indexing, and UI enhancements.
