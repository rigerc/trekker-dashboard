import type { ListFilters, ListItem } from '@/hooks/use-list';
import { compareBySortOption, type SortOption } from '@/lib/sort';
import { topologicalSort } from '@/lib/topological-sort';
import type { Epic, Task } from '@/types';

export interface GroupedListItem extends ListItem {
  depth: 0 | 1 | 2;
  childCount: number;
}

function epicToListItem(epic: Epic): ListItem {
  return {
    type: 'epic',
    id: epic.id,
    title: epic.title,
    status: epic.status,
    priority: epic.priority,
    parentId: null,
    createdAt: epic.createdAt,
    updatedAt: epic.updatedAt,
  };
}

function taskToListItem(task: Task): ListItem {
  let type: ListItem['type'] = 'task';
  if (task.parentTaskId) {
    type = 'subtask';
  }

  return {
    type,
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    parentId: task.parentTaskId ?? task.epicId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function matchesFilters(item: ListItem, filters: ListFilters, searchQuery: string): boolean {
  if (filters.types?.length && !filters.types.includes(item.type)) return false;
  if (filters.statuses?.length && !filters.statuses.includes(item.status)) return false;
  if (filters.priorities?.length && !filters.priorities.includes(item.priority)) return false;

  if (!searchQuery) return true;
  const normalizedSearch = searchQuery.toLowerCase();
  return (
    item.title.toLowerCase().includes(normalizedSearch) ||
    item.id.toLowerCase().includes(normalizedSearch)
  );
}

function toSortOption(value: string | undefined): SortOption {
  if (
    value === 'created:asc' ||
    value === 'updated:desc' ||
    value === 'priority:asc' ||
    value === 'priority:desc' ||
    value === 'title:asc' ||
    value === 'title:desc' ||
    value === 'build-order'
  ) {
    return value;
  }

  return 'created:desc';
}

export function buildGroupedListItems({
  epics,
  filters,
  searchQuery,
  tasks,
}: {
  epics: Epic[];
  filters: ListFilters;
  searchQuery: string;
  tasks: Task[];
}): GroupedListItem[] {
  const sort = toSortOption(filters.sort);
  const topLevelTasksByEpic = new Map<string, Task[]>();
  const subtasksByParent = new Map<string, Task[]>();
  const attachedTopLevelTaskIds = new Set<string>();
  const attachedSubtaskIds = new Set<string>();

  for (const task of tasks) {
    if (task.parentTaskId) {
      const group = subtasksByParent.get(task.parentTaskId);
      if (group) {
        group.push(task);
      } else {
        subtasksByParent.set(task.parentTaskId, [task]);
      }
      continue;
    }

    if (!task.epicId) continue;
    const group = topLevelTasksByEpic.get(task.epicId);
    if (group) {
      group.push(task);
    } else {
      topLevelTasksByEpic.set(task.epicId, [task]);
    }
  }

  const rows: GroupedListItem[] = [];

  function sortTaskArray(taskList: Task[]): Task[] {
    if (sort === 'build-order') {
      return topologicalSort(taskList);
    }
    return [...taskList].sort((a, b) => compareBySortOption(a, b, sort));
  }

  function includeTaskTree(task: Task, depth: 0 | 1 | 2): GroupedListItem[] {
    const item = taskToListItem(task);
    const subtasks = sortTaskArray(subtasksByParent.get(task.id) ?? []);
    const childRows = subtasks.flatMap((subtask) => includeTaskTree(subtask, 2));
    const includeSelf = matchesFilters(item, filters, searchQuery);
    if (!includeSelf && childRows.length === 0) return [];

    attachedSubtaskIds.add(task.id);
    return [{ ...item, depth, childCount: childRows.length }, ...childRows];
  }

  const sortedEpics = [...epics].sort((a, b) => compareBySortOption(a, b, sort));
  for (const epic of sortedEpics) {
    const item = epicToListItem(epic);
    const epicTasks = sortTaskArray(topLevelTasksByEpic.get(epic.id) ?? []);
    const childRows = epicTasks.flatMap((task) => {
      attachedTopLevelTaskIds.add(task.id);
      return includeTaskTree(task, 1);
    });
    const includeSelf = matchesFilters(item, filters, searchQuery);
    if (!includeSelf && childRows.length === 0) continue;

    rows.push({ ...item, depth: 0, childCount: childRows.length }, ...childRows);
  }

  const standaloneTasks = sortTaskArray(
    tasks.filter((task) => !task.parentTaskId && !attachedTopLevelTaskIds.has(task.id))
  );
  for (const task of standaloneTasks) {
    rows.push(...includeTaskTree(task, 0));
  }

  // For build-order: merge orphan subtasks into the standalone pool so
  // cross-pool dependencies are respected in topological order.
  if (sort === 'build-order') {
    const orphanSubtasks = tasks.filter(
      (task) => task.parentTaskId && !attachedSubtaskIds.has(task.id)
    );
    const combinedPool = sortTaskArray([...standaloneTasks, ...orphanSubtasks]);
    // Remove already-added standalone tasks from combined, keep only orphans
    const standaloneIds = new Set(standaloneTasks.map((t) => t.id));
    const remainingOrphans = combinedPool.filter((t) => !standaloneIds.has(t.id));
    for (const task of remainingOrphans) {
      const item = taskToListItem(task);
      if (matchesFilters(item, filters, searchQuery)) {
        rows.push({ ...item, depth: 0, childCount: 0 });
      }
    }
  } else {
    const orphanSubtasks = sortTaskArray(
      tasks.filter((task) => task.parentTaskId && !attachedSubtaskIds.has(task.id))
    );
    for (const task of orphanSubtasks) {
      const item = taskToListItem(task);
      if (matchesFilters(item, filters, searchQuery)) {
        rows.push({ ...item, depth: 0, childCount: 0 });
      }
    }
  }

  return rows;
}

export function paginateGroupedItems(
  items: GroupedListItem[],
  page: number,
  limit: number
): GroupedListItem[] {
  const offset = (page - 1) * limit;
  return items.slice(offset, offset + limit);
}

export function getListItemsFromAppData(epics: Epic[], tasks: Task[]): ListItem[] {
  return [...epics.map(epicToListItem), ...tasks.map(taskToListItem)];
}
