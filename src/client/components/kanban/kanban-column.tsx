'use client';

import { useDroppable } from '@dnd-kit/core';
import { Archive, Inbox, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ColumnFilter,
  type ColumnFilterState,
  DEFAULT_FILTER,
} from '@/components/kanban/column-filter';
import { EpicCard } from '@/components/kanban/epic-card';
import { TaskCard } from '@/components/kanban/task-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { compareBySortOption } from '@/lib/sort';
import { EPIC_STATUSES } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { CardDensity } from '@/stores/preferences';
import type { Epic, Task } from '@/types';

interface ActiveItem {
  type: 'task' | 'epic';
  id: string;
}

interface KanbanColumnProps {
  label: string;
  status: string;
  tasks: Task[];
  epics: Epic[];
  allTasks: Task[];
  allEpics: Epic[];
  onAddClick: () => void;
  onTaskClick: (task: Task) => void;
  onEpicClick: (epic: Epic) => void;
  onTaskLongPress?: (task: Task) => void;
  onEpicLongPress?: (epic: Epic) => void;
  onArchiveAll?: () => void;
  activeItem: ActiveItem | null;
  cardDensity: CardDensity;
  groupRelatedWork: boolean;
}

const CARD_LIST_GAP: Record<CardDensity, string> = {
  compact: 'gap-2',
  normal: 'gap-3',
  comfortable: 'gap-4',
};

const CARD_LIST_PADDING: Record<CardDensity, string> = {
  compact: 'p-3',
  normal: 'p-4',
  comfortable: 'p-5',
};

function getFilterSummary(filter: ColumnFilterState): string | null {
  if (filter.type === 'epic') return 'Epics only';
  if (filter.type === 'task') return 'Tasks only';
  if (filter.sort !== DEFAULT_FILTER.sort) return 'Sorted';
  return null;
}

function getEmptyMessage(status: string): { primary: string; secondary?: string } {
  if (status === 'todo')
    return { primary: 'No tasks queued', secondary: 'Click + to add your first task' };
  if (status === 'in_progress')
    return { primary: 'No active work', secondary: 'Drag tasks here to start working' };
  if (status === 'completed')
    return { primary: 'No completed tasks yet', secondary: 'Great work incoming!' };
  if (status === 'wont_fix')
    return { primary: 'No rejected work', secondary: 'Drag unwanted tasks here' };
  return { primary: 'No items' };
}

export function KanbanColumn({
  label,
  status,
  tasks,
  epics,
  allTasks,
  allEpics,
  onAddClick,
  onTaskClick,
  onEpicClick,
  onTaskLongPress,
  onEpicLongPress,
  onArchiveAll,
  activeItem,
  cardDensity,
  groupRelatedWork,
}: KanbanColumnProps) {
  const [filter, setFilter] = useState<ColumnFilterState>(DEFAULT_FILTER);

  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const isValidDrop =
    activeItem?.type !== 'epic' || EPIC_STATUSES.includes(status as (typeof EPIC_STATUSES)[number]);

  const filteredEpics = useMemo(() => {
    if (filter.type === 'task') return [];
    return [...epics].sort((a, b) => compareBySortOption(a, b, filter.sort));
  }, [epics, filter]);

  const filteredTasks = useMemo(() => {
    if (filter.type === 'epic') return [];
    let visibleTasks = tasks;
    if (groupRelatedWork) {
      visibleTasks = tasks.filter((task) => !task.epicId);
    }
    return [...visibleTasks].sort((a, b) => compareBySortOption(a, b, filter.sort));
  }, [groupRelatedWork, tasks, filter]);

  const totalCount = filteredTasks.length + filteredEpics.length;
  const filterSummary = getFilterSummary(filter);
  const emptyMessage = getEmptyMessage(status);

  const getEpicName = (epicId: string | null) => {
    if (!epicId) return null;
    const epic = allEpics.find((e) => e.id === epicId);
    return epic?.title || epicId;
  };

  const getSubtasks = (taskId: string) => allTasks.filter((t) => t.parentTaskId === taskId);

  const getTasksForEpic = (epicId: string) =>
    allTasks.filter((t) => t.epicId === epicId && !t.parentTaskId);

  const getTaskCountForEpic = (epicId: string) => {
    const epicTasks = allTasks.filter((t) => t.epicId === epicId && !t.parentTaskId);
    const completed = epicTasks.filter((t) => t.status === 'completed').length;
    return { total: epicTasks.length, completed };
  };

  const getGroupedEpicProps = (epicId: string) => {
    if (!groupRelatedWork) return {};
    return {
      childTasks: getTasksForEpic(epicId),
      subtasksByParent: getSubtasks,
    };
  };

  return (
    <div className="w-[calc(100vw-2rem)] sm:w-[280px] sm:min-w-[280px] sm:max-w-[320px] shrink-0 snap-start flex flex-col border rounded-md">
      <div className="flex items-center justify-between border-b px-4 py-2.5 bg-accent/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {totalCount}
          </Badge>
          {filterSummary && (
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline">
              {filterSummary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ColumnFilter value={filter} onChange={setFilter} label={label} />
          {onArchiveAll && totalCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onArchiveAll}
              title="Archive all completed items"
              aria-label="Archive all completed items"
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAddClick}
            title={`Add task to ${label}`}
            aria-label={`Add task to ${label}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[100px] overflow-y-auto transition-colors duration-150',
          isOver && isValidDrop && 'bg-accent/60 ring-2 ring-inset ring-ring/50',
          isOver && !isValidDrop && 'ring-2 ring-inset ring-destructive/40'
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            CARD_LIST_GAP[cardDensity],
            CARD_LIST_PADDING[cardDensity]
          )}
        >
          {filteredEpics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              taskCount={getTaskCountForEpic(epic.id)}
              {...getGroupedEpicProps(epic.id)}
              onChildTaskClick={onTaskClick}
              onClick={() => onEpicClick(epic)}
              onLongPress={() => onEpicLongPress?.(epic)}
              cardDensity={cardDensity}
            />
          ))}
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              epicName={getEpicName(task.epicId)}
              subtasks={getSubtasks(task.id)}
              showSubtaskList={groupRelatedWork}
              onClick={() => onTaskClick(task)}
              onLongPress={() => onTaskLongPress?.(task)}
              cardDensity={cardDensity}
            />
          ))}
          {totalCount === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 min-h-[120px] text-center px-4">
              <Inbox className="h-8 w-8 opacity-40" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{emptyMessage.primary}</p>
                {emptyMessage.secondary && (
                  <p className="text-xs text-muted-foreground/70">{emptyMessage.secondary}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
