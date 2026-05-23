'use client';

import { ChevronLeft, ChevronRight, FolderOpen, Plus, Settings } from 'lucide-react';
import { useState } from 'react';

import { DashboardSettingsDialog } from '@/components/dashboard-settings-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProjects, useProjectSuggestions } from '@/stores/dashboard-config';

const SUGGESTION_PREVIEW_LIMIT = 5;
const PROJECT_INITIALS_LENGTH = 2;

interface ProjectSidebarContentProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function ProjectSidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
}: ProjectSidebarContentProps) {
  const [dbPath, setDbPath] = useState('');
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const { projects, activeProjectId, openProject, addProject, isAddingProject } = useProjects();
  const suggestions = useProjectSuggestions();

  let toggleLabel = 'Collapse project sidebar';
  if (collapsed) {
    toggleLabel = 'Expand project sidebar';
  }
  let ToggleIcon: typeof ChevronLeft = ChevronLeft;
  if (collapsed) {
    ToggleIcon = ChevronRight;
  }
  let buttonSize: 'icon-sm' | 'sm' = 'sm';
  if (collapsed) {
    buttonSize = 'icon-sm';
  }
  let buttonClasses = 'w-full justify-start gap-2';
  if (collapsed) {
    buttonClasses = 'flex justify-center';
  }

  const suggestionsList = suggestions.data?.suggestions;
  const hasSuggestions = suggestionsList && suggestionsList.length > 0;

  function handleProjectClick(projectId: string) {
    openProject(projectId);
    onClose?.();
  }

  function handleSuggestionClick(project: { dbPath: string; name: string }) {
    addProject({ dbPath: project.dbPath, name: project.name });
    onClose?.();
  }

  function handleAddProject() {
    if (dbPath) {
      addProject({ dbPath });
    }
  }

  return (
    <>
      <div
        className={cn('mb-4 flex items-center gap-2 font-semibold', collapsed && 'justify-center')}
      >
        <FolderOpen className="h-4 w-4" />
        {!collapsed && <span>Projects</span>}
        {onToggleCollapse && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn('ml-auto', collapsed && 'ml-0')}
            onClick={onToggleCollapse}
            aria-label={toggleLabel}
          >
            <ToggleIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {projects.map((project) => {
          const className = cn(
            'w-full rounded px-3 py-2 text-left text-sm hover:bg-accent',
            project.id === activeProjectId && 'bg-accent font-medium',
            collapsed && 'flex h-10 items-center justify-center px-0 text-center'
          );

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => handleProjectClick(project.id)}
              className={className}
            >
              {collapsed && (
                <span className="font-semibold" title={project.name}>
                  {project.name.slice(0, PROJECT_INITIALS_LENGTH).toUpperCase()}
                </span>
              )}
              {!collapsed && (
                <>
                  <div className="truncate">{project.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{project.dbPath}</div>
                </>
              )}
            </button>
          );
        })}
      </div>
      {!collapsed && (
        <>
          <div className="mt-4 flex gap-2">
            <Input
              value={dbPath}
              onChange={(event) => setDbPath(event.target.value)}
              placeholder="/path/.trekker/trekker.db"
            />
            <Button
              size="icon"
              onClick={handleAddProject}
              aria-label="Add project"
              loading={isAddingProject}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {hasSuggestions && (
            <div className="mt-4 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Suggestions</div>
              {suggestionsList.slice(0, SUGGESTION_PREVIEW_LIMIT).map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSuggestionClick(project)}
                  className="w-full rounded px-3 py-2 text-left text-xs hover:bg-accent"
                >
                  <div className="truncate font-medium">{project.name}</div>
                  <div className="truncate text-muted-foreground">{project.dbPath}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className={cn('mt-4 border-t pt-3', collapsed && 'flex justify-center')}>
        <Button
          type="button"
          variant="ghost"
          size={buttonSize}
          className={cn('text-muted-foreground', buttonClasses)}
          onClick={() => setShowDashboardSettings(true)}
          aria-label="Dashboard settings"
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </Button>
      </div>

      <DashboardSettingsDialog
        open={showDashboardSettings}
        onOpenChange={setShowDashboardSettings}
      />
    </>
  );
}
