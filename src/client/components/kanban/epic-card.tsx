'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Layers } from 'lucide-react';

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
}

export function EpicCard({ epic, taskCount, onClick }: EpicCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 cursor-grab active:cursor-grabbing bg-blue-50 dark:bg-blue-900/60 hover:ring-1 transition-all duration-100 break-words',
        isDragging && 'opacity-0'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
          {epic.title}
        </h4>
        <PriorityBadge priority={epic.priority} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground/75">
          <Layers className="h-3.5 w-3.5" />
          {epic.id}
        </span>
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
