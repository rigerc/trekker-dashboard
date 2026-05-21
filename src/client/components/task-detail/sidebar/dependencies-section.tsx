'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SectionHeader } from '@/components/shared';
import { DependencyRow } from '@/components/task-detail/sidebar/dependency-row';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useTaskDependencies } from '@/hooks/use-task-dependencies';
import type { Task } from '@/types';

interface DependenciesSectionProps {
  task: Task;
  allTasks: Task[];
  onTaskClick?: (task: Task) => void;
  getTaskById: (id: string) => Task | undefined;
}

type DependencySide = 'depends' | 'blocks';

function getTaskLabel(task: Task): string {
  return `${task.id}: ${task.title}`;
}

function getTaskOptions(task: Task, allTasks: Task[], side: DependencySide) {
  const excludedIds = new Set([task.id, ...task.dependsOn, ...task.blocks]);
  if (task.parentTaskId) {
    excludedIds.add(task.parentTaskId);
  }

  for (const candidate of allTasks) {
    if (candidate.parentTaskId === task.id) {
      excludedIds.add(candidate.id);
    }
  }

  return allTasks
    .filter((candidate) => !excludedIds.has(candidate.id))
    .map((candidate) => ({
      value: candidate.id,
      label: getTaskLabel(candidate),
      side,
    }));
}

interface DependencyGroupProps {
  title: string;
  emptyText: string;
  side: DependencySide;
  taskIds: string[];
  task: Task;
  allTasks: Task[];
  activePicker: DependencySide | null;
  removingKey: string | null;
  onAdd: (side: DependencySide, taskId: string) => void;
  onOpen: (task: Task) => void;
  onRemove: (side: DependencySide, taskId: string) => void;
  onSetActivePicker: (side: DependencySide | null) => void;
  getTaskById: (id: string) => Task | undefined;
}

function DependencyGroup({
  title,
  emptyText,
  side,
  taskIds,
  task,
  allTasks,
  activePicker,
  removingKey,
  onAdd,
  onOpen,
  onRemove,
  onSetActivePicker,
  getTaskById,
}: DependencyGroupProps) {
  const options = useMemo(() => getTaskOptions(task, allTasks, side), [allTasks, side, task]);
  const pickerOpen = activePicker === side;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onSetActivePicker(pickerOpen ? null : side)}
          disabled={options.length === 0}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {pickerOpen && (
        <SearchableSelect
          options={options}
          value={null}
          onValueChange={(value) => {
            if (value) {
              onAdd(side, value);
            }
          }}
          placeholder="Search tasks..."
          emptyText="No available tasks"
        />
      )}

      {taskIds.length === 0 && !pickerOpen && (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}

      {taskIds.length > 0 && (
        <div className="space-y-1.5">
          {taskIds.map((taskId) => {
            const linkedTask = getTaskById(taskId);
            return (
              <DependencyRow
                key={taskId}
                taskId={taskId}
                task={linkedTask}
                variant={side}
                isRemoving={removingKey === `${side}:${taskId}`}
                onOpen={() => linkedTask && onOpen(linkedTask)}
                onRemove={() => onRemove(side, taskId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DependenciesSection({
  task,
  allTasks,
  onTaskClick,
  getTaskById,
}: DependenciesSectionProps) {
  const [activePicker, setActivePicker] = useState<DependencySide | null>(null);
  const { addDependency, removeDependency, removingKey } = useTaskDependencies();

  async function handleAdd(side: DependencySide, targetTaskId: string) {
    setActivePicker(null);

    if (side === 'depends') {
      await addDependency({ taskId: task.id, dependsOnId: targetTaskId });
      return;
    }

    await addDependency({ taskId: targetTaskId, dependsOnId: task.id });
  }

  async function handleRemove(side: DependencySide, targetTaskId: string) {
    if (side === 'depends') {
      await removeDependency({
        taskId: task.id,
        dependsOnId: targetTaskId,
        key: `${side}:${targetTaskId}`,
      });
      return;
    }

    await removeDependency({
      taskId: targetTaskId,
      dependsOnId: task.id,
      key: `${side}:${targetTaskId}`,
    });
  }

  function handleOpen(linkedTask: Task) {
    onTaskClick?.(linkedTask);
  }

  return (
    <div>
      <SectionHeader>Dependencies</SectionHeader>

      <div className="space-y-3">
        {task.dependsOn.length === 0 && task.blocks.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add blockers or prerequisites when task order matters.
          </p>
        )}

        <DependencyGroup
          title="Depends on"
          emptyText="No prerequisites"
          side="depends"
          taskIds={task.dependsOn}
          task={task}
          allTasks={allTasks}
          activePicker={activePicker}
          removingKey={removingKey}
          onAdd={handleAdd}
          onOpen={handleOpen}
          onRemove={handleRemove}
          onSetActivePicker={setActivePicker}
          getTaskById={getTaskById}
        />

        <DependencyGroup
          title="Blocks"
          emptyText="No blocked tasks"
          side="blocks"
          taskIds={task.blocks}
          task={task}
          allTasks={allTasks}
          activePicker={activePicker}
          removingKey={removingKey}
          onAdd={handleAdd}
          onOpen={handleOpen}
          onRemove={handleRemove}
          onSetActivePicker={setActivePicker}
          getTaskById={getTaskById}
        />
      </div>
    </div>
  );
}
