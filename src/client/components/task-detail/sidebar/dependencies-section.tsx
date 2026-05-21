'use client';

import { useState } from 'react';

import { SectionHeader } from '@/components/shared';
import {
  DependencyGroup,
  type DependencySide,
} from '@/components/task-detail/sidebar/dependency-group';
import { useTaskDependencies } from '@/hooks/use-task-dependencies';
import type { Task } from '@/types';

interface DependenciesSectionProps {
  task: Task;
  allTasks: Task[];
  onTaskClick?: (task: Task) => void;
  getTaskById: (id: string) => Task | undefined;
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
