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
import { useState } from 'react';

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
import type { Epic, Task } from '@/types';

function noop(): void {
  // overlay cards are visual-only; clicks are intentionally suppressed
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
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [quickItem, setQuickItem] = useState<ActiveItem | null>(null);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const quickUpdate = useDragStatusUpdate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const topLevelTasks = tasks.filter((task) => !task.parentTaskId);

  const getTasksByStatus = (status: string) =>
    topLevelTasks.filter((task) => task.status === status);

  const getEpicsByStatus = (status: string) => epics.filter((epic) => epic.status === status);

  function getArchiveHandler(columnKey: (typeof STATUS_COLUMNS)[number]['key']) {
    if (columnKey === 'completed') {
      return onArchiveAllCompleted;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type: 'task' | 'epic'; id: string };
    setActiveItem({ type: data.type, id: data.id });
  }

  function handleDragEnd(event: DragEndEvent) {
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
  }

  function handleDragCancel() {
    setActiveItem(null);
  }

  // Data needed for the drag overlay
  let activeTask: Task | null = null;
  if (activeItem?.type === 'task') {
    activeTask = tasks.find((t) => t.id === activeItem.id) ?? null;
  }
  let activeEpic: Epic | null = null;
  if (activeItem?.type === 'epic') {
    activeEpic = epics.find((e) => e.id === activeItem.id) ?? null;
  }

  let quickActionItem: QuickActionItem | null = null;
  if (quickItem?.type === 'task') {
    const task = tasks.find((t) => t.id === quickItem.id);
    if (task) {
      quickActionItem = { type: 'task', item: task };
    }
  }
  if (quickItem?.type === 'epic') {
    const epic = epics.find((e) => e.id === quickItem.id);
    if (epic) {
      quickActionItem = { type: 'epic', item: epic };
    }
  }

  const getEpicName = (epicId: string | null) => {
    if (!epicId) return null;
    return epics.find((e) => e.id === epicId)?.title ?? null;
  };
  const getSubtasks = (taskId: string) => tasks.filter((t) => t.parentTaskId === taskId);
  const getTaskCountForEpic = (epicId: string) => {
    const epicTasks = tasks.filter((t) => t.epicId === epicId && !t.parentTaskId);
    return {
      total: epicTasks.length,
      completed: epicTasks.filter((t) => t.status === 'completed').length,
    };
  };

  function openQuickActions(item: ActiveItem) {
    setQuickActionError(null);
    setQuickItem(item);
  }

  function closeQuickActions(open: boolean) {
    if (!open) {
      setQuickItem(null);
      setQuickActionError(null);
    }
  }

  async function updateQuickAction(payload: { status?: string; priority?: number }) {
    if (!quickItem) return;

    setQuickActionError(null);
    try {
      await quickUpdate.mutateAsync({ ...quickItem, ...payload });
      setQuickItem(null);
    } catch (error) {
      setQuickActionError(getErrorMessage(error, 'Could not update card'));
    }
  }

  function openQuickActionDetails() {
    if (!quickActionItem) return;

    if (quickActionItem.type === 'task') {
      onTaskClick(quickActionItem.item);
    } else {
      onEpicClick(quickActionItem.item);
    }
    setQuickItem(null);
  }

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
            tasks={getTasksByStatus(column.key)}
            epics={getEpicsByStatus(column.key)}
            allTasks={tasks}
            allEpics={epics}
            onAddClick={() => onAddClick(column.key)}
            onTaskClick={onTaskClick}
            onEpicClick={onEpicClick}
            onTaskLongPress={(task) => openQuickActions({ type: 'task', id: task.id })}
            onEpicLongPress={(epic) => openQuickActions({ type: 'epic', id: epic.id })}
            onArchiveAll={getArchiveHandler(column.key)}
            activeItem={activeItem}
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
            />
          </div>
        )}
        {activeEpic && (
          <div className="opacity-95 rotate-1 scale-[1.02] shadow-xl pointer-events-none">
            <EpicCard
              epic={activeEpic}
              taskCount={getTaskCountForEpic(activeEpic.id)}
              onClick={noop}
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
