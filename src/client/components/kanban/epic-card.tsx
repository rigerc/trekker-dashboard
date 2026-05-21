'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Layers } from 'lucide-react';

import { useLongPress } from '@/components/kanban/use-long-press';
import { PriorityBadge } from '@/components/priority-badge';
import { Progress } from '@/components/ui/progress';
import { FULL_PERCENTAGE } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Epic } from '@/types';

interface EpicCardProps {
  epic: Epic;
  taskCount: { total: number; completed: number };
  onClick: () => void;
  onLongPress?: () => void;
}

export function EpicCard({ epic, taskCount, onClick, onLongPress }: EpicCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-grab active:cursor-grabbing border border-border/80 bg-card hover:bg-accent/50 hover:ring-1 transition-all duration-100 break-words border-l-[3px] border-l-primary/20',
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
        <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
          {epic.title}
        </h4>
        <PriorityBadge priority={epic.priority} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary dark:bg-primary/10">
          <Layers className="h-3.5 w-3.5" />
          Epic
        </span>
        <span className="font-mono font-medium text-foreground/75">{epic.id}</span>
        <span>{formatRelativeTime(epic.createdAt)}</span>
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {taskCount.completed}/{taskCount.total} tasks
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{percentage}%</span>
        </div>
        {taskCount.total > 0 && <Progress value={percentage} className="h-1.5" />}
      </div>
    </div>
  );
}
