'use client';

import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

import { PriorityBadge } from '@/components/priority-badge';
import { StatusIcon } from '@/components/shared';
import { STATUS_LABELS } from '@/lib/constants';
import type { Task } from '@/types';

const STATUS_ACCENT: Record<string, string> = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  wont_fix: '#f59e0b',
  archived: '#9ca3af',
};

interface DependencyNodeData {
  task: Task;
}

export type DependencyFlowNode = Node<DependencyNodeData, 'dependency'>;

function DependencyFlowNodeComponent({ data }: NodeProps<DependencyFlowNode>) {
  const { task } = data;
  const accent = STATUS_ACCENT[task.status] ?? '#6b7280';

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className="flex w-[220px] flex-col gap-2 rounded-md border bg-card p-3 text-left"
        style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-5">
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono font-medium text-foreground/75">{task.id}</span>
          <span className="inline-flex items-center gap-1">
            <StatusIcon status={task.status} className="h-3.5 w-3.5" />
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export const nodeTypes = { dependency: DependencyFlowNodeComponent };
