'use client';

import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Epic, Task } from '@/types';

type QuickActionItem = { type: 'task'; item: Task } | { type: 'epic'; item: Epic };

interface CardQuickActionsSheetProps {
  item: QuickActionItem | null;
  open: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onOpenDetails: () => void;
  onPriorityChange: (priority: number) => void;
  onStatusChange: (status: string) => void;
}

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const QUICK_TASK_STATUSES = ['todo', 'in_progress', 'completed', 'wont_fix'] as const;
const QUICK_EPIC_STATUSES = ['todo', 'in_progress', 'completed'] as const;

function getButtonVariant(isSelected: boolean): 'default' | 'outline' {
  if (isSelected) return 'default';
  return 'outline';
}

export function CardQuickActionsSheet({
  item,
  open,
  isSaving,
  errorMessage,
  onOpenChange,
  onOpenDetails,
  onPriorityChange,
  onStatusChange,
}: CardQuickActionsSheetProps) {
  let statuses: readonly string[] = QUICK_TASK_STATUSES;
  let itemTypeLabel = 'Task';
  if (item?.type === 'epic') {
    statuses = QUICK_EPIC_STATUSES;
    itemTypeLabel = 'Epic';
  }
  const currentStatus = item?.item.status;
  const currentPriority = item?.item.priority;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-xl pb-2 sm:hidden">
        <SheetHeader className="border-b pr-12">
          <SheetTitle className="truncate text-base">{item?.item.title ?? 'Quick edit'}</SheetTitle>
          {item && (
            <p className="font-mono text-xs text-muted-foreground">
              {itemTypeLabel} {item.item.id}
            </p>
          )}
        </SheetHeader>

        <div className="space-y-5 p-4">
          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={getButtonVariant(status === currentStatus)}
                  size="sm"
                  className="justify-start"
                  disabled={isSaving || status === currentStatus}
                  onClick={() => onStatusChange(status)}
                >
                  {STATUS_LABELS[status] ?? status}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Priority
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITY_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={getButtonVariant(value === currentPriority)}
                  size="sm"
                  className={cn(
                    'justify-start font-mono',
                    value === currentPriority && 'font-semibold'
                  )}
                  disabled={isSaving || value === currentPriority}
                  onClick={() => onPriorityChange(value)}
                >
                  P{value} <span className="font-sans font-normal opacity-80">{label}</span>
                </Button>
              ))}
            </div>
          </section>

          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center"
            onClick={onOpenDetails}
          >
            <ExternalLink className="h-4 w-4" />
            Open details
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type { QuickActionItem };
