'use client';

import { createContext, type Dispatch, type ReactNode, type SetStateAction, useState } from 'react';

import { ProjectSidebar } from '@/components/project-sidebar';
import { ProjectSidebarMobile } from '@/components/project-sidebar-mobile';

interface MobileSidebarContextValue {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export const MobileSidebarContext = createContext<MobileSidebarContextValue | undefined>(undefined);

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <MobileSidebarContext.Provider value={{ mobileSidebarOpen, setMobileSidebarOpen }}>
      <div className="flex min-h-screen">
        <ProjectSidebar />
        <ProjectSidebarMobile open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MobileSidebarContext.Provider>
  );
}
