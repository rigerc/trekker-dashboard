'use client';

import { Package, Plus, SlidersHorizontal } from 'lucide-react';

import { NotificationToggle } from '@/components/notification-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import type { ProjectConfig } from '@/types';

interface AppHeaderActionsProps {
  projectConfig?: ProjectConfig;
  projectName?: string;
  onNewClick?: () => void;
  onProjectConfigClick: () => void;
}

export function AppHeaderActions({
  projectConfig,
  projectName,
  onNewClick,
  onProjectConfigClick,
}: AppHeaderActionsProps) {
  const projectNameContent = projectName && (
    <div className="hidden sm:flex items-center gap-1">
      <Package className="text-muted-foreground" width={16} />
      <span className="text-sm text-muted-foreground">{projectName}</span>
    </div>
  );

  const projectConfigButton = projectConfig && (
    <Button size="sm" variant="outline" onClick={onProjectConfigClick}>
      <SlidersHorizontal className="h-4 w-4" />
      <span className="hidden sm:inline ml-1">Prefixes</span>
    </Button>
  );

  const newButton = onNewClick && (
    <Button size="sm" onClick={onNewClick}>
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline ml-1">New</span>
    </Button>
  );

  return (
    <div className="flex gap-3 sm:gap-6">
      {projectNameContent}

      <div className="flex items-center gap-2">
        {projectConfigButton}
        {newButton}
        <NotificationToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
