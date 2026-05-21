'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeftToLine, ArrowRightFromLine, Layers, SquareCheck } from 'lucide-react';

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
}

export function TaskCard({ task, epicName, subtasks, onClick }: TaskCardProps) {
  const completedSubtasks = subtasks.filter((s) => s.status === 'completed').length;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', id: task.id, currentStatus: task.status },
  });

  let style: React.CSSProperties | undefined;
  if (transform) {
    style = { transform: CSS.Translate.toString(transform) };
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={cn(
        'p-4 hover:ring-1 transition-all duration-100 bg-accent w-full flex flex-col break-words cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-0'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <SquareCheck width={16} />
          <span className="font-mono text-xs font-medium text-foreground">{task.id}</span>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <h4 className="text-sm font-semibold mb-2.5">{task.title}</h4>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      )}

      {(epicName || task.tags) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {epicName && (
            <p className="text-xs flex gap-2 items-center">
              <Layers width={16} />
              {epicName}
            </p>
          )}
          {task.tags?.split(',').map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      )}

      {(task.dependsOn.length > 0 || task.blocks.length > 0) && (
        <div className="pt-2 border-t flex flex-wrap gap-1">
          {task.dependsOn.map((depId) => (
            <span
              key={depId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400"
              title={`Depends on ${depId}`}
            >
              <ArrowLeftToLine className="h-2.5 w-2.5" />
              {depId}
            </span>
          ))}
          {task.blocks.map((blockId) => (
            <span
              key={blockId}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400"
              title={`Blocks ${blockId}`}
            >
              <ArrowRightFromLine className="h-2.5 w-2.5" />
              {blockId}
            </span>
          ))}
        </div>
      )}

      {subtasks.length > 0 && (
        <SubtaskProgress completed={completedSubtasks} total={subtasks.length} />
      )}

      <p className="text-[10px] text-muted-foreground mt-1.5">
        {formatRelativeTime(task.createdAt)}
      </p>
    </div>
  );
}
