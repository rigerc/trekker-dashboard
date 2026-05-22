'use client';

import { ChevronLeft, ChevronRight, FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProjects, useProjectSuggestions } from '@/stores/dashboard-config';

const SUGGESTION_PREVIEW_LIMIT = 5;
const PROJECT_INITIALS_LENGTH = 2;

export function ProjectSidebar() {
  const [dbPath, setDbPath] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { projects, activeProjectId, openProject, addProject, isAddingProject } = useProjects();
  const suggestions = useProjectSuggestions();

  let sidebarWidthClass = 'w-72';
  if (isCollapsed) {
    sidebarWidthClass = 'w-16';
  }

  let toggleLabel = 'Collapse project sidebar';
  if (isCollapsed) {
    toggleLabel = 'Expand project sidebar';
  }

  let ToggleIcon = ChevronLeft;
  if (isCollapsed) {
    ToggleIcon = ChevronRight;
  }

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r bg-muted/20 p-3 transition-[width] lg:block',
        sidebarWidthClass
      )}
    >
      <div
        className={cn(
          'mb-4 flex items-center gap-2 font-semibold',
          isCollapsed && 'justify-center'
        )}
      >
        <FolderOpen className="h-4 w-4" />
        {!isCollapsed && <span>Projects</span>}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('ml-auto', isCollapsed && 'ml-0')}
          onClick={() => setIsCollapsed((value) => !value)}
          aria-label={toggleLabel}
        >
          <ToggleIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {projects.map((project) => {
          let className = cn(
            'w-full rounded px-3 py-2 text-left text-sm hover:bg-accent',
            isCollapsed && 'flex h-10 items-center justify-center px-0 text-center'
          );
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
              {isCollapsed && (
                <span className="font-semibold" title={project.name}>
                  {project.name.slice(0, PROJECT_INITIALS_LENGTH).toUpperCase()}
                </span>
              )}
              {!isCollapsed && (
                <>
                  <div className="truncate">{project.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{project.dbPath}</div>
                </>
              )}
            </button>
          );
        })}
      </div>
      {!isCollapsed && (
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
            loading={isAddingProject}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!isCollapsed && Boolean(suggestions.data?.suggestions.length) && (
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
