'use client';

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCallback, useMemo, useState } from 'react';

import {
  CardQuickActionsSheet,
  type QuickActionItem,
} from '@/components/kanban/card-quick-actions-sheet';
import { EpicCard } from '@/components/kanban/epic-card';
import { KanbanColumn } from '@/components/kanban/kanban-column';
import { TaskCard } from '@/components/kanban/task-card';
import { useDragStatusUpdate } from '@/hooks/use-drag-status-update';
import { getErrorMessage } from '@/lib/errors';
import { EPIC_STATUSES } from '@/lib/types';
import { usePreferences } from '@/stores/preferences';
import type { Epic, Task } from '@/types';

function noop(): void {
  return undefined;
}

const STATUS_COLUMNS = [
  { key: 'todo', label: 'TODO' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'wont_fix', label: "Won't Fix" },
] as const;

interface ActiveItem {
  type: 'task' | 'epic';
  id: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  epics: Epic[];
  onAddClick: (status: string) => void;
  onTaskClick: (task: Task) => void;
  onEpicClick: (epic: Epic) => void;
  onArchiveAllCompleted?: () => void;
}

export function KanbanBoard({
  tasks,
  epics,
  onAddClick,
  onTaskClick,
  onEpicClick,
  onArchiveAllCompleted,
}: KanbanBoardProps) {
  const { preferences } = usePreferences();
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [quickItem, setQuickItem] = useState<ActiveItem | null>(null);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const quickUpdate = useDragStatusUpdate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const topLevelTasks = useMemo(() => tasks.filter((task) => !task.parentTaskId), [tasks]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of topLevelTasks) {
      const group = map.get(task.status);
      if (group) {
        group.push(task);
      } else {
        map.set(task.status, [task]);
      }
    }
    return map;
  }, [topLevelTasks]);

  const epicsByStatus = useMemo(() => {
    const map = new Map<string, Epic[]>();
    for (const epic of epics) {
      const group = map.get(epic.status);
      if (group) {
        group.push(epic);
      } else {
        map.set(epic.status, [epic]);
      }
    }
    return map;
  }, [epics]);

  const taskById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const task of tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [tasks]);

  const epicMap = useMemo(() => {
    const map = new Map<string, Epic>();
    for (const epic of epics) {
      map.set(epic.id, epic);
    }
    return map;
  }, [epics]);

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.parentTaskId) continue;
      const group = map.get(task.parentTaskId);
      if (group) {
        group.push(task);
      } else {
        map.set(task.parentTaskId, [task]);
      }
    }
    return map;
  }, [tasks]);

  const tasksByEpic = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.epicId || task.parentTaskId) continue;
      const group = map.get(task.epicId);
      if (group) {
        group.push(task);
      } else {
        map.set(task.epicId, [task]);
      }
    }
    return map;
  }, [tasks]);

  const activeTask = useMemo(() => {
    if (activeItem?.type !== 'task') return null;
    return taskById.get(activeItem.id) ?? null;
  }, [activeItem, taskById]);

  const activeEpic = useMemo(() => {
    if (activeItem?.type !== 'epic') return null;
    return epicMap.get(activeItem.id) ?? null;
  }, [activeItem, epicMap]);

  const quickActionItem = useMemo((): QuickActionItem | null => {
    if (!quickItem) return null;
    if (quickItem.type === 'task') {
      const task = taskById.get(quickItem.id);
      if (task) {
        return { type: 'task', item: task };
      }
      return null;
    }
    const epic = epicMap.get(quickItem.id);
    if (epic) {
      return { type: 'epic', item: epic };
    }
    return null;
  }, [quickItem, taskById, epicMap]);

  const getEpicName = useCallback(
    (epicId: string | null) => {
      if (!epicId) return null;
      return epicMap.get(epicId)?.title ?? null;
    },
    [epicMap]
  );

  const getSubtasks = useCallback(
    (taskId: string) => subtasksByParent.get(taskId) ?? [],
    [subtasksByParent]
  );

  const getTaskCountForEpic = useCallback(
    (epicId: string) => {
      const epicTasks = tasksByEpic.get(epicId) ?? [];
      let completed = 0;
      for (const t of epicTasks) {
        if (t.status === 'completed') completed++;
      }
      return { total: epicTasks.length, completed };
    },
    [tasksByEpic]
  );

  function getArchiveHandler(columnKey: (typeof STATUS_COLUMNS)[number]['key']) {
    if (columnKey === 'completed') {
      return onArchiveAllCompleted;
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { type: 'task' | 'epic'; id: string };
    setActiveItem({ type: data.type, id: data.id });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);

      const { active, over } = event;
      if (!over) return;

      const { type, id, currentStatus } = active.data.current as {
        type: 'task' | 'epic';
        id: string;
        currentStatus: string;
      };
      const newStatus = (over.data.current as { status: string }).status;

      if (newStatus === currentStatus) return;

      if (type === 'epic' && !EPIC_STATUSES.includes(newStatus as (typeof EPIC_STATUSES)[number])) {
        return;
      }

      quickUpdate.mutate({ type, id, status: newStatus });
    },
    [quickUpdate]
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
  }, []);

  const openQuickActions = useCallback((item: ActiveItem) => {
    setQuickActionError(null);
    setQuickItem(item);
  }, []);

  const closeQuickActions = useCallback((open: boolean) => {
    if (!open) {
      setQuickItem(null);
      setQuickActionError(null);
    }
  }, []);

  const updateQuickAction = useCallback(
    async (payload: { status?: string; priority?: number }) => {
      if (!quickItem) return;

      setQuickActionError(null);
      try {
        await quickUpdate.mutateAsync({ ...quickItem, ...payload });
        setQuickItem(null);
      } catch (error) {
        setQuickActionError(getErrorMessage(error, 'Could not update card'));
      }
    },
    [quickItem, quickUpdate]
  );

  const openQuickActionDetails = useCallback(() => {
    if (!quickActionItem) return;

    if (quickActionItem.type === 'task') {
      onTaskClick(quickActionItem.item);
    } else {
      onEpicClick(quickActionItem.item);
    }
    setQuickItem(null);
  }, [quickActionItem, onTaskClick, onEpicClick]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-5 items-start flex-nowrap min-h-[calc(100dvh-180px)] snap-x snap-mandatory overflow-x-auto">
        {STATUS_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.key}
            label={column.label}
            status={column.key}
            tasks={tasksByStatus.get(column.key) ?? []}
            epics={epicsByStatus.get(column.key) ?? []}
            allTasks={tasks}
            allEpics={epics}
            onAddClick={() => onAddClick(column.key)}
            onTaskClick={onTaskClick}
            onEpicClick={onEpicClick}
            onTaskLongPress={(task) => openQuickActions({ type: 'task', id: task.id })}
            onEpicLongPress={(epic) => openQuickActions({ type: 'epic', id: epic.id })}
            onArchiveAll={getArchiveHandler(column.key)}
            activeItem={activeItem}
            cardDensity={preferences.cardDensity}
            groupRelatedWork={preferences.groupRelatedWork}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className="opacity-95 rotate-1 scale-[1.02] shadow-xl pointer-events-none">
            <TaskCard
              task={activeTask}
              epicName={getEpicName(activeTask.epicId)}
              subtasks={getSubtasks(activeTask.id)}
              onClick={noop}
              cardDensity={preferences.cardDensity}
            />
          </div>
        )}
        {activeEpic && (
          <div className="opacity-95 rotate-1 scale-[1.02] shadow-xl pointer-events-none">
            <EpicCard
              epic={activeEpic}
              taskCount={getTaskCountForEpic(activeEpic.id)}
              onClick={noop}
              cardDensity={preferences.cardDensity}
            />
          </div>
        )}
      </DragOverlay>

      <CardQuickActionsSheet
        item={quickActionItem}
        open={Boolean(quickActionItem)}
        isSaving={quickUpdate.isPending}
        errorMessage={quickActionError}
        onOpenChange={closeQuickActions}
        onOpenDetails={openQuickActionDetails}
        onStatusChange={(status) => void updateQuickAction({ status })}
        onPriorityChange={(priority) => void updateQuickAction({ priority })}
      />
    </DndContext>
  );
}
