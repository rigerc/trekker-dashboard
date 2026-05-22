'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUpdateProjectConfig } from '@/hooks/use-data';
import { getErrorMessage } from '@/lib/errors';
import type {
  CardDensity,
  DefaultGraphView,
  DefaultHistoryView,
  DefaultPage,
  UserPreferences,
} from '@/stores/preferences';
import { DEFAULT_PREFERENCES, usePreferences } from '@/stores/preferences';
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
  cardDensity: CardDensity;
  defaultPage: DefaultPage;
  defaultGraphView: DefaultGraphView;
  defaultHistoryView: DefaultHistoryView;
  listPageSize: number;
  listDefaultSort: string;
}

function getInitialForm(
  projectConfig?: ProjectConfig,
  preferences?: UserPreferences
): SettingsFormState {
  return {
    issuePrefix: projectConfig?.issuePrefix ?? '',
    epicPrefix: projectConfig?.epicPrefix ?? '',
    commentPrefix: projectConfig?.commentPrefix ?? '',
    cardDensity: preferences?.cardDensity ?? DEFAULT_PREFERENCES.cardDensity,
    defaultPage: preferences?.defaultPage ?? DEFAULT_PREFERENCES.defaultPage,
    defaultGraphView: preferences?.defaultGraphView ?? DEFAULT_PREFERENCES.defaultGraphView,
    defaultHistoryView: preferences?.defaultHistoryView ?? DEFAULT_PREFERENCES.defaultHistoryView,
    listPageSize: preferences?.listPageSize ?? DEFAULT_PREFERENCES.listPageSize,
    listDefaultSort: preferences?.listDefaultSort ?? DEFAULT_PREFERENCES.listDefaultSort,
  };
}

export function useProjectConfigForm({
  open,
  onOpenChange,
  projectConfig,
}: ProjectConfigDialogStateOptions) {
  const { preferences, setPreferences } = usePreferences();
  const [form, setForm] = useState<SettingsFormState>(() =>
    getInitialForm(projectConfig, preferences)
  );
  const updateProjectConfig = useUpdateProjectConfig();

  useEffect(() => {
    setForm(getInitialForm(projectConfig, preferences));
  }, [open, projectConfig, preferences]);

  function handleFieldChange(field: keyof SettingsFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNumberChange(field: 'listPageSize', value: string) {
    setForm((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await updateProjectConfig.mutateAsync({
        issuePrefix: form.issuePrefix,
        epicPrefix: form.epicPrefix,
        commentPrefix: form.commentPrefix,
      });
      setPreferences({
        cardDensity: form.cardDensity,
        defaultPage: form.defaultPage,
        defaultGraphView: form.defaultGraphView,
        defaultHistoryView: form.defaultHistoryView,
        listPageSize: form.listPageSize,
        listDefaultSort: form.listDefaultSort,
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
    handleNumberChange,
    handleSubmit,
    isPending: updateProjectConfig.isPending,
  };
}
