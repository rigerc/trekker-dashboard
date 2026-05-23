'use client';

import { GitBranchPlus, Menu } from 'lucide-react';
import { useContext, useState } from 'react';

import { AppHeaderActions } from '@/components/app-header-actions';
import { AppNavigation } from '@/components/app-navigation';
import { MobileSidebarContext } from '@/components/app-shell';
import { ProjectConfigDialog } from '@/components/project-config-dialog';
import type { ProjectConfig } from '@/types';

interface AppHeaderProps {
  projectName?: string;
  projectConfig?: ProjectConfig;
  onNewClick?: () => void;
}

export function AppHeader({ projectName, projectConfig, onNewClick }: AppHeaderProps) {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const mobileSidebar = useContext(MobileSidebarContext);

  return (
    <>
      <header className="border-b bg-accent/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 md:gap-6">
            {mobileSidebar && (
              <button
                type="button"
                className="lg:hidden rounded-md p-1.5 hover:bg-accent"
                onClick={() => mobileSidebar.setMobileSidebarOpen((v) => !v)}
                aria-label="Open project sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <GitBranchPlus className="h-5 w-5" />
              <h1 className="text-xl font-bold">trekker</h1>
            </div>

            <div className="hidden md:block">
              <AppNavigation />
            </div>
          </div>

          <div className="flex items-center gap-2 border-l pl-4">
            <AppHeaderActions
              projectName={projectName}
              onNewClick={onNewClick}
              onProjectConfigClick={() => setShowConfigDialog(true)}
            />
          </div>
        </div>

        <div className="flex md:hidden border-t px-4 py-2">
          <AppNavigation />
        </div>
      </header>

      <ProjectConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        projectName={projectName}
        projectConfig={projectConfig}
      />
    </>
  );
}
