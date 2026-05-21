'use client';

import { GitBranch, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useAppData } from '@/hooks/use-data';
import { useTaskDetailActions } from '@/hooks/use-task-detail-actions';
import { cn } from '@/lib/utils';
import { DependencyGraphRow } from '@/pages/dependency-graph-components';
import { EntityDetailModals } from '@/pages/entity-detail-modals';
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

  if (isLoading && tasks.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center p-5">
        <span className="text-muted-foreground">Loading graph...</span>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-5">
        <span className="text-destructive">Could not load dependency graph</span>
      </main>
    );
  }

  let content;
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
  } else {
    content = (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <GitBranch className="h-8 w-8 opacity-40" />
        <span className="text-sm text-muted-foreground">No dependencies yet</span>
        <span className="max-w-sm text-xs text-muted-foreground">
          Open a task and add prerequisites or blockers to build the graph.
        </span>
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
