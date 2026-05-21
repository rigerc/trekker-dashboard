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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Layers width={16} />
          <span className="font-mono text-xs font-medium text-foreground">{epic.id}</span>
        </div>
        <PriorityBadge priority={epic.priority} />
      </div>

      <h4 className="text-sm font-semibold mb-3">{epic.title}</h4>

      <div className="border-t pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {taskCount.completed}/{taskCount.total} tasks
          </p>
          <span className="text-[10px] text-muted-foreground font-mono">{percentage}%</span>
        </div>
        {taskCount.total > 0 && <Progress value={percentage} className="h-1.5" />}
        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(epic.createdAt)}</p>
      </div>
    </div>
  );
}
