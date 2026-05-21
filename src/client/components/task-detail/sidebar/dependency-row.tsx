'use client';

import { ArrowLeftToLine, ArrowRightFromLine, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface DependencyRowProps {
  taskId: string;
  task?: Task;
  variant: 'depends' | 'blocks';
  isRemoving: boolean;
  onOpen: () => void;
  onRemove: () => void;
}

export function DependencyRow({
  taskId,
  task,
  variant,
  isRemoving,
  onOpen,
  onRemove,
}: DependencyRowProps) {
  const label = variant === 'depends' ? 'Needs' : 'Blocks';
  const Icon = variant === 'depends' ? ArrowLeftToLine : ArrowRightFromLine;

  return (
    <div
      className={cn(
        'group flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors',
        variant === 'depends' &&
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        variant === 'blocks' &&
          'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        isRemoving && 'opacity-60'
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={onOpen}
        disabled={isRemoving}
        title={task ? `${label} ${task.id}: ${task.title}` : `${label} ${taskId}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="shrink-0 font-medium">{label}</span>
        <span className="shrink-0 font-mono text-[11px] text-foreground/75">{taskId}</span>
        {task && <span className="truncate text-muted-foreground">{task.title}</span>}
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6 shrink-0 opacity-70 hover:opacity-100"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`Remove ${label.toLowerCase()} dependency ${taskId}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
