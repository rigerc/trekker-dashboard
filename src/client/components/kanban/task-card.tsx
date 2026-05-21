'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeftToLine, ArrowRightFromLine, Layers, SquareCheck } from 'lucide-react';

import { useLongPress } from '@/components/kanban/use-long-press';
import { PriorityBadge } from '@/components/priority-badge';
import { SubtaskProgress } from '@/components/subtask-progress';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  epicName: string | null;
  subtasks: Task[];
  onClick: () => void;
  onLongPress?: () => void;
}

export function TaskCard({ task, epicName, subtasks, onClick, onLongPress }: TaskCardProps) {
  const completedSubtasks = subtasks.filter((s) => s.status === 'completed').length;
  const hasDependencies = task.dependsOn.length > 0 || task.blocks.length > 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', id: task.id, currentStatus: task.status },
  });

  let style: React.CSSProperties | undefined;
  if (transform) {
    style = { transform: CSS.Translate.toString(transform) };
  }

  const { isPressing, ...longPress } = useLongPress({
    onLongPress: () => onLongPress?.(),
  });
  const draggableListeners = listeners as React.DOMAttributes<HTMLDivElement>;

  function handleClick() {
    if (longPress.shouldSuppressClick()) return;
    onClick();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    longPress.onPointerDown(event);
    draggableListeners.onPointerDown?.(event);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={cn(
        'p-4 hover:ring-1 transition-all duration-100 bg-accent w-full flex flex-col break-words cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-0',
        isPressing && 'ring-2 ring-ring scale-[0.98] transition-all duration-150 delay-150'
      )}
      onClick={handleClick}
      {...attributes}
      aria-label={`Open task ${task.id}: ${task.title}`}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerCancel={longPress.onPointerCancel}
      onPointerUp={longPress.onPointerUp}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground/75">
          <SquareCheck className="h-3.5 w-3.5" />
          {task.id}
        </span>
        {epicName && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{epicName}</span>
          </span>
        )}
        <span>{formatRelativeTime(task.createdAt)}</span>
      </div>

      {hasDependencies && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {task.blocks.map((blockId) => (
            <span
              key={blockId}
              className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400"
              title={`Blocks ${blockId}`}
            >
              <ArrowRightFromLine className="h-2.5 w-2.5" />
              Blocks {blockId}
            </span>
          ))}
          {task.dependsOn.map((depId) => (
            <span
              key={depId}
              className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
              title={`Depends on ${depId}`}
            >
              <ArrowLeftToLine className="h-2.5 w-2.5" />
              Needs {depId}
            </span>
          ))}
        </div>
      )}

      {task.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      )}

      {task.tags && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.split(',').map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-normal">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="mt-3">
          <SubtaskProgress completed={completedSubtasks} total={subtasks.length} />
        </div>
      )}
    </div>
  );
}
