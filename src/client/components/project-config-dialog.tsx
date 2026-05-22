'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectConfigForm } from '@/components/use-project-config-form';
import { SORT_OPTIONS } from '@/lib/sort';
import type {
  CardDensity,
  DefaultGraphView,
  DefaultHistoryView,
  DefaultPage,
} from '@/stores/preferences';
import type { ProjectConfig } from '@/types';

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

interface ProjectConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectConfig?: ProjectConfig;
}

export function ProjectConfigDialog({
  open,
  onOpenChange,
  projectName,
  projectConfig,
}: ProjectConfigDialogProps) {
  const { form, handleFieldChange, handleNumberChange, handleSubmit, isPending } =
    useProjectConfigForm({ open, onOpenChange, projectConfig });

  let descriptionPrefix = '';
  if (projectName) {
    descriptionPrefix = `${projectName}: `;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            {descriptionPrefix}
            Configure project ID prefixes and dashboard preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">ID Prefixes</h3>

            <div className="space-y-2">
              <Label htmlFor="issue-prefix">Issue prefix</Label>
              <Input
                id="issue-prefix"
                value={form.issuePrefix}
                onChange={(event) => handleFieldChange('issuePrefix', event.target.value)}
                placeholder="TREK"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epic-prefix">Epic prefix</Label>
              <Input
                id="epic-prefix"
                value={form.epicPrefix}
                onChange={(event) => handleFieldChange('epicPrefix', event.target.value)}
                placeholder="EPIC"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment-prefix">Comment prefix</Label>
              <Input
                id="comment-prefix"
                value={form.commentPrefix}
                onChange={(event) => handleFieldChange('commentPrefix', event.target.value)}
                placeholder="CMT"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Dashboard Preferences</h3>

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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !projectConfig}
              loading={isPending}
              loadingText="Saving"
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
