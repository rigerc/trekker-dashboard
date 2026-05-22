'use client';

import { FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects,useProjectSuggestions } from '@/stores/dashboard-config';

const SUGGESTION_PREVIEW_LIMIT = 5;

export function ProjectSidebar() {
  const [dbPath, setDbPath] = useState('');
  const { projects, activeProjectId, openProject, addProject } = useProjects();
  const suggestions = useProjectSuggestions();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-muted/20 p-3 lg:block">
      <div className="mb-4 flex items-center gap-2 font-semibold">
        <FolderOpen className="h-4 w-4" /> Projects
      </div>
      <div className="space-y-1">
        {projects.map((project) => {
          let className = 'w-full rounded px-3 py-2 text-left text-sm hover:bg-accent';
          if (project.id === activeProjectId) {
            className += ' bg-accent font-medium';
          }

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => openProject(project.id)}
              className={className}
            >
              <div className="truncate">{project.name}</div>
              <div className="truncate text-xs text-muted-foreground">{project.dbPath}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        <Input
          value={dbPath}
          onChange={(event) => setDbPath(event.target.value)}
          placeholder="/path/.trekker/trekker.db"
        />
        <Button
          size="icon"
          onClick={() => dbPath && addProject({ dbPath })}
          aria-label="Add project"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {Boolean(suggestions.data?.suggestions.length) && (
        <div className="mt-4 space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Suggestions</div>
          {suggestions.data?.suggestions.slice(0, SUGGESTION_PREVIEW_LIMIT).map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => addProject({ dbPath: project.dbPath, name: project.name })}
              className="w-full rounded px-3 py-2 text-left text-xs hover:bg-accent"
            >
              <div className="truncate font-medium">{project.name}</div>
              <div className="truncate text-muted-foreground">{project.dbPath}</div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
