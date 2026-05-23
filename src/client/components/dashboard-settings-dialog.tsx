'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SORT_OPTIONS } from '@/lib/sort';
import type {
  CardDensity,
  DefaultGraphView,
  DefaultHistoryView,
  DefaultPage,
  UserPreferences,
} from '@/stores/preferences';
import { DEFAULT_PREFERENCES, usePreferences } from '@/stores/preferences';

const CARD_DENSITY_OPTIONS: { value: CardDensity; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'comfortable', label: 'Comfortable' },
];

const DEFAULT_PAGE_OPTIONS: { value: DefaultPage; label: string }[] = [
  { value: '/', label: 'Kanban' },
  { value: '/list', label: 'List' },
  { value: '/graph', label: 'Graph' },
  { value: '/history', label: 'History' },
];

const DEFAULT_GRAPH_VIEW_OPTIONS: { value: DefaultGraphView; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'graph', label: 'Graph map' },
];

const DEFAULT_HISTORY_VIEW_OPTIONS: { value: DefaultHistoryView; label: string }[] = [
  { value: 'all', label: 'All events' },
  { value: 'tasks', label: 'Tasks and subtasks' },
  { value: 'epics', label: 'Epics' },
  { value: 'comments', label: 'Comments' },
  { value: 'dependencies', label: 'Dependencies' },
];

const LIST_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

type DashboardForm = Pick<
  UserPreferences,
  | 'cardDensity'
  | 'defaultPage'
  | 'defaultGraphView'
  | 'defaultHistoryView'
  | 'listPageSize'
  | 'listDefaultSort'
  | 'groupRelatedWork'
>;

function getInitialForm(preferences?: UserPreferences): DashboardForm {
  return {
    cardDensity: preferences?.cardDensity ?? DEFAULT_PREFERENCES.cardDensity,
    defaultPage: preferences?.defaultPage ?? DEFAULT_PREFERENCES.defaultPage,
    defaultGraphView: preferences?.defaultGraphView ?? DEFAULT_PREFERENCES.defaultGraphView,
    defaultHistoryView: preferences?.defaultHistoryView ?? DEFAULT_PREFERENCES.defaultHistoryView,
    listPageSize: preferences?.listPageSize ?? DEFAULT_PREFERENCES.listPageSize,
    listDefaultSort: preferences?.listDefaultSort ?? DEFAULT_PREFERENCES.listDefaultSort,
    groupRelatedWork: preferences?.groupRelatedWork ?? DEFAULT_PREFERENCES.groupRelatedWork,
  };
}

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSettingsDialog({ open, onOpenChange }: DashboardSettingsDialogProps) {
  const { preferences, setPreferences } = usePreferences();
  const [form, setForm] = useState<DashboardForm>(() => getInitialForm(preferences));

  useEffect(() => {
    setForm(getInitialForm(preferences));
  }, [open, preferences]);

  function handleFieldChange(field: keyof DashboardForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleNumberChange(field: 'listPageSize', value: string) {
    setForm((current) => ({ ...current, [field]: Number(value) }));
  }

  function handleBooleanChange(field: 'groupRelatedWork', value: string) {
    setForm((current) => ({ ...current, [field]: value === 'true' }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreferences(form);
    toast.success('Dashboard settings saved');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>Configure your display and navigation preferences.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-density">Card density (Kanban)</Label>
            <Select
              value={form.cardDensity}
              onValueChange={(value) => handleFieldChange('cardDensity', value)}
            >
              <SelectTrigger id="card-density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_DENSITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-page">Default landing page</Label>
            <Select
              value={form.defaultPage}
              onValueChange={(value) => handleFieldChange('defaultPage', value)}
            >
              <SelectTrigger id="default-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-graph-view">Default graph view</Label>
            <Select
              value={form.defaultGraphView}
              onValueChange={(value) => handleFieldChange('defaultGraphView', value)}
            >
              <SelectTrigger id="default-graph-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_GRAPH_VIEW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-history-view">Default history view</Label>
            <Select
              value={form.defaultHistoryView}
              onValueChange={(value) => handleFieldChange('defaultHistoryView', value)}
            >
              <SelectTrigger id="default-history-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_HISTORY_VIEW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-page-size">List page size</Label>
            <Select
              value={String(form.listPageSize)}
              onValueChange={(value) => handleNumberChange('listPageSize', value)}
            >
              <SelectTrigger id="list-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIST_PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-default-sort">List default sort</Label>
            <Select
              value={form.listDefaultSort}
              onValueChange={(value) => handleFieldChange('listDefaultSort', value)}
            >
              <SelectTrigger id="list-default-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-related-work">Group related work</Label>
            <Select
              value={String(form.groupRelatedWork)}
              onValueChange={(value) => handleBooleanChange('groupRelatedWork', value)}
            >
              <SelectTrigger id="group-related-work">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Flat list and board</SelectItem>
                <SelectItem value="true">Group epics, tasks, and subtasks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              Keeps child tasks next to their epic or parent task in list and kanban views.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
