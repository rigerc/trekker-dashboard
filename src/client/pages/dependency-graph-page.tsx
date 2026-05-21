'use client';

import { ArrowLeftToLine, ArrowRightFromLine, GitBranch, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EntityDetailModals } from '@/pages/entity-detail-modals';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusIcon } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppData } from '@/hooks/use-data';
import { useTaskDetailActions } from '@/hooks/use-task-detail-actions';
import { STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface DependencyEdge {
  from: Task;
  to: Task;
}

function getDependencyEdges(tasks: Task[]): DependencyEdge[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const edges: DependencyEdge[] = [];

  for (const task of tasks) {
    for (const dependencyId of task.dependsOn) {
      const dependency = taskById.get(dependencyId);
      if (dependency) {
        edges.push({ from: dependency, to: task });
      }
    }
  }

  return edges;
}

function getGraphTasks(tasks: Task[], edges: DependencyEdge[], searchQuery: string): Task[] {
  const connectedTaskIds = new Set<string>();
  for (const edge of edges) {
    connectedTaskIds.add(edge.from.id);
    connectedTaskIds.add(edge.to.id);
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    if (!connectedTaskIds.has(task.id)) return false;
    if (!normalizedSearch) return true;

    return (
      task.id.toLowerCase().includes(normalizedSearch) ||
      task.title.toLowerCase().includes(normalizedSearch)
    );
  });
}

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

function DependencyGraphRow({
  task,
  allTasks,
  onTaskClick,
}: {
  task: Task;
  allTasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const taskById = new Map(allTasks.map((currentTask) => [currentTask.id, currentTask]));
  const dependencies = task.dependsOn
    .map((taskId) => taskById.get(taskId))
    .filter((dependency): dependency is Task => Boolean(dependency));
  const blockedTasks = task.blocks
    .map((taskId) => taskById.get(taskId))
    .filter((blockedTask): blockedTask is Task => Boolean(blockedTask));

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(260px,1.1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowLeftToLine className="h-3.5 w-3.5 text-amber-500" />
          Needs
        </div>
        {dependencies.length > 0 ? (
          <div className="space-y-1.5">
            {dependencies.map((dependency) => (
              <DependencyMiniNode key={dependency.id} task={dependency} onClick={onTaskClick} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No prerequisites</p>
        )}
      </div>

      <div className="min-w-0">
        <DependencyTaskNode task={task} onClick={onTaskClick} />
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <ArrowRightFromLine className="h-3.5 w-3.5 text-rose-500" />
          Blocks
        </div>
        {blockedTasks.length > 0 ? (
          <div className="space-y-1.5">
            {blockedTasks.map((blockedTask) => (
              <DependencyMiniNode key={blockedTask.id} task={blockedTask} onClick={onTaskClick} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No blocked tasks</p>
        )}
      </div>
    </div>
  );
}

export function DependencyGraphPage() {
  const { epics, error, isLoading, refetch, tasks } = useAppData();
  const detailActions = useTaskDetailActions(tasks, epics);
  const [searchQuery, setSearchQuery] = useState('');

  const edges = useMemo(() => getDependencyEdges(tasks), [tasks]);
  const graphTasks = useMemo(
    () => getGraphTasks(tasks, edges, searchQuery),
    [edges, searchQuery, tasks]
  );
  const blockedCount = graphTasks.filter((task) => task.dependsOn.length > 0).length;
  const blockerCount = graphTasks.filter((task) => task.blocks.length > 0).length;

  let content = (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <GitBranch className="h-8 w-8 opacity-40" />
      <span className="text-sm text-muted-foreground">No dependencies yet</span>
      <span className="max-w-sm text-xs text-muted-foreground">
        Open a task and add prerequisites or blockers to build the graph.
      </span>
    </div>
  );

  if (graphTasks.length > 0) {
    content = (
      <div className="space-y-3 p-3">
        {graphTasks.map((task) => (
          <DependencyGraphRow
            key={task.id}
            task={task}
            allTasks={tasks}
            onTaskClick={(nextTask) => detailActions.openTaskDetail(nextTask.id)}
          />
        ))}
      </div>
    );
  }

  if (error) {
    content = (
      <div className="flex h-full items-center justify-center">
        <span className="text-destructive">Could not load dependency graph</span>
      </div>
    );
  }

  if (isLoading) {
    content = (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground">Loading graph...</span>
      </div>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Dependency Graph</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Trace prerequisites and blocked work across connected tasks.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search graph..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Edges
            </p>
            <p className="mt-1 text-2xl font-semibold">{edges.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Blocked tasks
            </p>
            <p className="mt-1 text-2xl font-semibold">{blockedCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Blockers
            </p>
            <p className="mt-1 text-2xl font-semibold">{blockerCount}</p>
          </div>
        </div>

        <div
          className={cn(
            'flex-1 overflow-auto rounded-lg border',
            graphTasks.length === 0 && 'min-h-[280px]'
          )}
        >
          {content}
        </div>
      </main>

      <EntityDetailModals
        allTasks={tasks}
        epics={epics}
        selectedEpic={detailActions.selectedEpic}
        selectedEpicTasks={detailActions.selectedEpicTasks}
        selectedTask={detailActions.selectedTask}
        onCloseEpicDetail={detailActions.closeEpicDetail}
        onCloseTaskDetail={detailActions.closeTaskDetail}
        onEpicDetailTaskClick={detailActions.handleEpicModalTaskClick}
        onTaskDetailEpicClick={detailActions.handleTaskModalEpicClick}
        onTaskDetailTaskClick={(task) => detailActions.openTaskDetail(task.id)}
        onUpdate={refetch}
      />
    </>
  );
}
