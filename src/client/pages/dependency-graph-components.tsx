/* eslint-disable dashboard/no-multi-comp */
'use client';

import { ArrowLeftToLine, ArrowRightFromLine } from 'lucide-react';

import { PriorityBadge } from '@/components/priority-badge';
import { StatusIcon } from '@/components/shared';
import { STATUS_LABELS } from '@/lib/constants';
import type { Task } from '@/types';

function DependencyMiniNode({ task, onClick }: { task: Task; onClick: (task: Task) => void }) {
  return (
    <button
      type="button"
      className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={() => onClick(task)}
    >
      <StatusIcon status={task.status} className="h-3.5 w-3.5" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{task.title}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{task.id}</span>
    </button>
  );
}

function DependencyTaskNode({ task, onClick }: { task: Task; onClick: (task: Task) => void }) {
  return (
    <button
      type="button"
      className="flex min-w-0 flex-col gap-2 rounded-md border bg-card p-3 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 text-sm font-semibold leading-5">{task.title}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-mono font-medium text-foreground/75">{task.id}</span>
        <span className="inline-flex items-center gap-1">
          <StatusIcon status={task.status} className="h-3.5 w-3.5" />
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>
    </button>
  );
}

function resolveTasks(taskIds: string[], taskById: Map<string, Task>): Task[] {
  return taskIds.flatMap((taskId) => {
    const task = taskById.get(taskId);
    if (!task) return [];
    return [task];
  });
}

const MOBILE_PREVIEW_LIMIT = 2;

function DependencyPreviewList({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const visibleTasks = tasks.slice(0, MOBILE_PREVIEW_LIMIT);
  const hiddenCount = tasks.length - visibleTasks.length;

  if (tasks.length === 0) {
    return <span className="text-xs text-muted-foreground">None</span>;
  }

  return (
    <div className="space-y-1.5">
      {visibleTasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => onTaskClick(task)}
        >
          <StatusIcon status={task.status} className="h-3.5 w-3.5" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{task.title}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{task.id}</span>
        </button>
      ))}
      {hiddenCount > 0 && <p className="text-xs text-muted-foreground">+{hiddenCount} more</p>}
    </div>
  );
}

interface DependencyGraphColumnProps {
  title: string;
  emptyText: string;
  tasks: Task[];
  variant: 'depends' | 'blocks';
  onTaskClick: (task: Task) => void;
}

function DependencyGraphColumn({
  title,
  emptyText,
  tasks,
  variant,
  onTaskClick,
}: DependencyGraphColumnProps) {
  let Icon = ArrowRightFromLine;
  let iconClassName = 'h-3.5 w-3.5 text-rose-500';
  if (variant === 'depends') {
    Icon = ArrowLeftToLine;
    iconClassName = 'h-3.5 w-3.5 text-amber-500';
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={iconClassName} />
        {title}
      </div>
      {tasks.length > 0 && (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <DependencyMiniNode key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      )}
      {tasks.length === 0 && <p className="text-xs text-muted-foreground">{emptyText}</p>}
    </div>
  );
}

export function DependencyGraphRow({
  task,
  allTasks,
  onTaskClick,
}: {
  task: Task;
  allTasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const taskById = new Map(allTasks.map((currentTask) => [currentTask.id, currentTask]));
  const dependencies = resolveTasks(task.dependsOn, taskById);
  const blockedTasks = resolveTasks(task.blocks, taskById);

  return (
    <>
      <div className="rounded-lg border bg-muted/20 p-3 sm:hidden">
        <button
          type="button"
          className="flex min-h-11 w-full min-w-0 flex-col gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 text-sm font-semibold leading-5">{task.title}</span>
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono font-medium text-foreground/75">{task.id}</span>
            <span className="inline-flex items-center gap-1">
              <StatusIcon status={task.status} className="h-3.5 w-3.5" />
              {STATUS_LABELS[task.status] ?? task.status}
            </span>
          </div>
        </button>

        <div className="mt-3 grid gap-3 border-t pt-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ArrowLeftToLine className="h-3.5 w-3.5 text-amber-500" />
                Needs
              </span>
              <span>{dependencies.length}</span>
            </div>
            <DependencyPreviewList tasks={dependencies} onTaskClick={onTaskClick} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ArrowRightFromLine className="h-3.5 w-3.5 text-rose-500" />
                Blocks
              </span>
              <span>{blockedTasks.length}</span>
            </div>
            <DependencyPreviewList tasks={blockedTasks} onTaskClick={onTaskClick} />
          </div>
        </div>
      </div>

      <div className="hidden gap-3 rounded-lg border bg-muted/20 p-3 sm:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,1.1fr)_minmax(0,1fr)]">
        <DependencyGraphColumn
          title="Needs"
          emptyText="No prerequisites"
          tasks={dependencies}
          variant="depends"
          onTaskClick={onTaskClick}
        />

        <div className="min-w-0">
          <DependencyTaskNode task={task} onClick={onTaskClick} />
        </div>

        <DependencyGraphColumn
          title="Blocks"
          emptyText="No blocked tasks"
          tasks={blockedTasks}
          variant="blocks"
          onTaskClick={onTaskClick}
        />
      </div>
    </>
  );
}
