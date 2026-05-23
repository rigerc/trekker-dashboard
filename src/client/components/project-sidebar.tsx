'use client';

import { useState } from 'react';

import { ProjectSidebarContent } from '@/components/project-sidebar-content';
import { cn } from '@/lib/utils';

export function ProjectSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  let sidebarWidth = 'w-72';
  if (isCollapsed) {
    sidebarWidth = 'w-16';
  }

  function handleToggleCollapse() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r bg-muted/20 p-3 transition-[width] lg:block',
        sidebarWidth
      )}
    >
      <ProjectSidebarContent collapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
    </aside>
  );
}
