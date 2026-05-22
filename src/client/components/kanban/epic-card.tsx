'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Layers, SquareCheck } from 'lucide-react';

import { useLongPress } from '@/components/kanban/use-long-press';
import { PriorityBadge } from '@/components/priority-badge';
import { Progress } from '@/components/ui/progress';
import { FULL_PERCENTAGE } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { CardDensity } from '@/stores/preferences';
import type { Epic, Task } from '@/types';

interface EpicCardProps {
  epic: Epic;
  taskCount: { total: number; completed: number };
  onClick: () => void;
  onLongPress?: () => void;
  cardDensity?: CardDensity;
  childTasks?: Task[];
  subtasksByParent?: (taskId: string) => Task[];
  onChildTaskClick?: (task: Task) => void;
}

const cardPadding: Record<CardDensity, string> = {
  compact: 'p-3.5',
  normal: 'p-5',
  comfortable: 'p-6',
};

const sectionGap: Record<CardDensity, string> = {
  compact: 'mt-1.5',
  normal: 'mt-2',
  comfortable: 'mt-3',
};

const sectionGapLarge: Record<CardDensity, string> = {
  compact: 'mt-2',
  normal: 'mt-3',
  comfortable: 'mt-4',
};

const idTextSize: Record<CardDensity, string> = {
  compact: 'text-xs',
  normal: 'text-xs',
  comfortable: 'text-xs',
};

const timeTextSize: Record<CardDensity, string> = {
  compact: 'text-xs',
  normal: 'text-xs',
  comfortable: 'text-sm',
};

export function EpicCard({
  epic,
  taskCount,
  onClick,
  onLongPress,
  cardDensity = 'normal',
  childTasks = [],
  subtasksByParent,
  onChildTaskClick,
}: EpicCardProps) {
  let percentage = 0;
  if (taskCount.total > 0) {
    percentage = Math.round((taskCount.completed / taskCount.total) * FULL_PERCENTAGE);
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `epic-${epic.id}`,
    data: { type: 'epic', id: epic.id, currentStatus: epic.status },
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

  const visibleChildTasks = childTasks.slice(0, 4);
  const hiddenChildCount = Math.max(0, childTasks.length - visibleChildTasks.length);

  function handleChildClick(event: React.MouseEvent<HTMLButtonElement>, task: Task) {
    event.stopPropagation();
    onChildTaskClick?.(task);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        cardPadding[cardDensity],
        'cursor-grab active:cursor-grabbing border border-border/80 bg-card hover:bg-accent/50 hover:ring-1 transition-all duration-100 break-words border-l-[3px] border-l-primary/20',
        isDragging && 'opacity-0',
        isPressing && 'ring-2 ring-ring scale-[0.98] transition-all duration-150 delay-150'
      )}
      onClick={handleClick}
      {...attributes}
      aria-label={`Open epic ${epic.id}: ${epic.title}`}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerCancel={longPress.onPointerCancel}
      onPointerUp={longPress.onPointerUp}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 flex-1 text-base font-semibold leading-6 text-foreground">
          {epic.title}
        </h4>
        <PriorityBadge priority={epic.priority} />
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground',
          sectionGap[cardDensity]
        )}
      >
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary dark:bg-primary/10">
          <Layers className="h-3.5 w-3.5" />
          Epic
        </span>
        <span className={cn('font-semibold text-foreground/75', idTextSize[cardDensity])}>
          {epic.id}
        </span>
        <span className={timeTextSize[cardDensity]}>{formatRelativeTime(epic.createdAt)}</span>
      </div>

      <div className={cn('border-t pt-3', sectionGapLarge[cardDensity])}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {taskCount.completed}/{taskCount.total} tasks
          </span>
          <span className="font-medium text-xs text-muted-foreground">{percentage}%</span>
        </div>
        {taskCount.total > 0 && <Progress value={percentage} className="h-1.5" />}
      </div>

      {visibleChildTasks.length > 0 && (
        <div className={cn('space-y-1.5 border-t pt-3', sectionGapLarge[cardDensity])}>
          {visibleChildTasks.map((task) => {
            const subtaskCount = subtasksByParent?.(task.id).length ?? 0;
            return (
              <button
                key={task.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-1 py-0.5 text-left text-sm text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
                onClick={(event) => handleChildClick(event, task)}
              >
                <SquareCheck className="h-3 w-3 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                {subtaskCount > 0 && (
                  <span className="shrink-0 font-medium text-xs">{subtaskCount}</span>
                )}
              </button>
            );
          })}
          {hiddenChildCount > 0 && (
            <div className="px-1 text-xs text-muted-foreground">+{hiddenChildCount} more tasks</div>
          )}
        </div>
      )}
    </div>
  );
}
