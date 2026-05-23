'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateProjectConfig } from '@/hooks/use-data';
import { getErrorMessage } from '@/lib/errors';
import type { ProjectConfig } from '@/types';

interface ProjectConfigDialogStateOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectConfig?: ProjectConfig;
}

interface SettingsFormState {
  issuePrefix: string;
  epicPrefix: string;
  commentPrefix: string;
}

function getInitialForm(projectConfig?: ProjectConfig): SettingsFormState {
  return {
    issuePrefix: projectConfig?.issuePrefix ?? '',
    epicPrefix: projectConfig?.epicPrefix ?? '',
    commentPrefix: projectConfig?.commentPrefix ?? '',
  };
}

export function useProjectConfigForm({
  open,
  onOpenChange,
  projectConfig,
}: ProjectConfigDialogStateOptions) {
  const [form, setForm] = useState<SettingsFormState>(() => getInitialForm(projectConfig));
  const updateProjectConfig = useUpdateProjectConfig();

  useEffect(() => {
    setForm(getInitialForm(projectConfig));
  }, [open, projectConfig]);

  function handleFieldChange(field: keyof SettingsFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateProjectConfig.mutateAsync({
        issuePrefix: form.issuePrefix,
        epicPrefix: form.epicPrefix,
        commentPrefix: form.commentPrefix,
      });
      toast.success('Settings saved');
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update settings'));
    }
  }

  return {
    form,
    handleFieldChange,
    handleSubmit,
    isPending: updateProjectConfig.isPending,
  };
}
