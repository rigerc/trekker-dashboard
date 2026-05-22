'use client';

import { ProjectConfigDialog } from '@/components/project-config-dialog';
import type { ProjectConfig } from '@/types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectConfig?: ProjectConfig;
}

export function SettingsDialog(props: SettingsDialogProps) {
  return <ProjectConfigDialog {...props} />;
}
