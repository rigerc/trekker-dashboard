'use client';

import { Plus } from 'lucide-react';
import { useMemo } from 'react';

import { DependencyRow } from '@/components/task-detail/sidebar/dependency-row';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Task } from '@/types';

export type DependencySide = 'depends' | 'blocks';

function getTaskLabel(task: Task): string {
  return `${task.id}: ${task.title}`;
}

function getTaskOptions(task: Task, allTasks: Task[]) {
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

export function DependencyGroup({
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
  const options = useMemo(() => getTaskOptions(task, allTasks), [allTasks, task]);
  const pickerOpen = activePicker === side;

  function togglePicker() {
    if (pickerOpen) {
      onSetActivePicker(null);
      return;
    }
    onSetActivePicker(side);
  }

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
          onClick={togglePicker}
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
