'use client';

import type { ListEntityType, ListFilters } from '@/hooks/use-list';
import { PRIORITY_LABELS, STATUS_LABELS, TASK_STATUSES } from '@/lib/constants';
import { SORT_OPTIONS } from '@/lib/sort';
import {
  type FilterOption,
  parseFilterValues,
  parseNumericFilterValues,
  serializeFilterValues,
  withResetPage,
} from '@/pages/filter-helpers';
import { ListPageFiltersView } from '@/pages/list-page-filters-view';

const TYPE_OPTIONS: FilterOption<ListEntityType>[] = [
  { value: 'epic', label: 'Epic' },
  { value: 'task', label: 'Task' },
  { value: 'subtask', label: 'Subtask' },
];

const STATUS_OPTIONS: FilterOption[] = TASK_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

const PRIORITY_OPTIONS: FilterOption[] = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label: `P${value} - ${label}`,
}));

interface ListPageFiltersProps {
  filters: ListFilters;
  groupRelatedWork: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSearchQueryChange: (value: string) => void;
  onSetFilters: (filters: ListFilters) => void;
  onToggleTypeFilter: (type: ListEntityType) => void;
  searchQuery: string;
}

export function ListPageFilters({
  filters,
  groupRelatedWork,
  hasActiveFilters,
  onClearFilters,
  onSearchQueryChange,
  onSetFilters,
  onToggleTypeFilter,
  searchQuery,
}: ListPageFiltersProps) {
  function updateFilters(updates: Partial<ListFilters>) {
    onSetFilters(withResetPage(filters, updates));
  }

  const sortOptions = groupRelatedWork
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((option) => option.value !== 'build-order');

  return (
    <ListPageFiltersView
      hasActiveFilters={hasActiveFilters}
      priorityOptions={PRIORITY_OPTIONS}
      priorityValue={serializeFilterValues(filters.priorities)}
      searchQuery={searchQuery}
      selectedTypes={filters.types ?? []}
      sortOptions={sortOptions}
      sortValue={filters.sort ?? 'created:desc'}
      statusOptions={STATUS_OPTIONS}
      statusValue={serializeFilterValues(filters.statuses)}
      typeOptions={TYPE_OPTIONS}
      onClearFilters={onClearFilters}
      onPriorityChange={(value) => updateFilters({ priorities: parseNumericFilterValues(value) })}
      onSearchQueryChange={onSearchQueryChange}
      onSortChange={(value) => updateFilters({ sort: value })}
      onStatusChange={(value) =>
        updateFilters({ statuses: parseFilterValues(value, STATUS_OPTIONS) })
      }
      onToggleTypeFilter={onToggleTypeFilter}
    />
  );
}
