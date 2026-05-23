'use client';

import { ProjectSidebarContent } from '@/components/project-sidebar-content';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface ProjectSidebarMobileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSidebarMobile({ open, onOpenChange }: ProjectSidebarMobileProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 sm:max-w-sm">
        <ProjectSidebarContent
          onClose={() => {
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
