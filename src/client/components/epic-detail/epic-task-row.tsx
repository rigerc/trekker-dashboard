'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Square, SquareCheck, SquareX } from 'lucide-react';

import { updateTaskRequest } from '@/components/task-detail/form-helpers';
import { isTerminalStatus } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface EpicTaskRowProps {
  task: Task;
  onTaskClick?: (task: Task) => void;
}

export function EpicTaskRow({ task, onTaskClick }: EpicTaskRowProps) {
  const queryClient = useQueryClient();
  const isDone = isTerminalStatus(task.status);

  let nextStatus: string;
  if (task.status === 'completed') {
    nextStatus = 'todo';
  } else {
    nextStatus = 'completed';
  }

  const { mutate: toggleStatus, isPending } = useMutation({
    mutationFn: () => updateTaskRequest(task.id, { status: nextStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus();
  };

  let ariaLabel: string;
  if (isDone) {
    ariaLabel = 'Mark as todo';
  } else {
    ariaLabel = 'Mark as completed';
  }

  let icon: React.ReactNode;
  switch (task.status) {
    case 'completed':
      icon = <SquareCheck className="h-4 w-4 shrink-0 text-green-500" />;
      break;
    case 'wont_fix':
      icon = <SquareX className="h-4 w-4 shrink-0 text-amber-500" />;
      break;
    case 'archived':
      icon = <Archive className="h-4 w-4 shrink-0 text-gray-400" />;
      break;
    default:
      icon = (
        <Square className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground/70" />
      );
      break;
  }

  return (
    <div className="group flex items-center gap-2 rounded-sm p-1.5 hover:bg-muted/50">
      <button
        type="button"
        className="shrink-0 cursor-pointer disabled:opacity-50"
        onClick={handleToggle}
        disabled={isPending}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={() => onTaskClick?.(task)}
      >
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{task.id}</span>
        <span className={cn('truncate text-sm', isDone && 'text-muted-foreground line-through')}>
          {task.title}
        </span>
      </button>
    </div>
  );
}
