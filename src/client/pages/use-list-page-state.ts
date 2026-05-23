import { useMemo, useState } from 'react';

import { useAppData } from '@/hooks/use-data';
import { type ListEntityType, type ListFilters, type ListItem, useList } from '@/hooks/use-list';
import { useTaskDetailActions } from '@/hooks/use-task-detail-actions';
import {
  buildGroupedListItems,
  type GroupedListItem,
  paginateGroupedItems,
} from '@/lib/group-related-work';
import { usePreferences } from '@/stores/preferences';

export function useListPageState() {
  const { epics, error: appDataError, isLoading: isAppDataLoading, refetch, tasks } = useAppData();
  const { preferences } = usePreferences();
  const detailActions = useTaskDetailActions(tasks, epics);
  const [filters, setFilters] = useState<ListFilters>({
    limit: preferences.listPageSize,
    page: 1,
    sort: preferences.listDefaultSort,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { data, error, isLoading } = useList(filters);
  const groupRelatedWork = preferences.groupRelatedWork;

  function handleRowClick(item: ListItem) {
    if (item.type === 'epic') {
      detailActions.openEpicDetail(item.id);
      return;
    }

    detailActions.openTaskDetail(item.id);
  }

  function toggleTypeFilter(type: ListEntityType) {
    const currentTypes = filters.types ?? [];
    let nextTypes = [...currentTypes, type];
    if (currentTypes.includes(type)) {
      nextTypes = currentTypes.filter((currentType) => currentType !== type);
    }

    let normalizedTypes: ListEntityType[] | undefined = nextTypes;
    if (nextTypes.length === 0) {
      normalizedTypes = undefined;
    }

    setFilters({
      ...filters,
      types: normalizedTypes,
      page: 1,
    });
  }

  function clearFilters() {
    setFilters({
      limit: filters.limit,
      page: 1,
      sort: filters.sort,
    });
    setSearchQuery('');
  }

  const groupedItems = useMemo(() => {
    if (!groupRelatedWork) return [];
    return buildGroupedListItems({ epics, filters, searchQuery, tasks });
  }, [epics, filters, groupRelatedWork, searchQuery, tasks]);

  let filteredItems: (ListItem | GroupedListItem)[] = [];
  let listResponse = data;
  if (groupRelatedWork) {
    const limit = filters.limit ?? preferences.listPageSize;
    const page = filters.page ?? 1;
    filteredItems = paginateGroupedItems(groupedItems, page, limit);
    listResponse = {
      total: groupedItems.length,
      page,
      limit,
      items: filteredItems,
    };
  } else if (data) {
    filteredItems = data.items.filter((item) => {
      if (!searchQuery) {
        return true;
      }

      const normalizedSearch = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.id.toLowerCase().includes(normalizedSearch)
      );
    });
  }
  const hasActiveFilters = Boolean(
    filters.types?.length || filters.statuses?.length || filters.priorities?.length
  );
  let totalPages = 0;
  if (listResponse) {
    totalPages = Math.ceil(listResponse.total / (filters.limit ?? preferences.listPageSize));
  }

  let effectiveError = error;
  let effectiveIsLoading = isLoading;
  if (groupRelatedWork) {
    effectiveError = appDataError;
    effectiveIsLoading = isAppDataLoading;
  }

  return {
    ...detailActions,
    clearFilters,
    data: listResponse,
    epics,
    error: effectiveError,
    filteredItems,
    filters,
    groupRelatedWork,
    handleRowClick,
    hasActiveFilters,
    isLoading: effectiveIsLoading,
    refetch,
    searchQuery,
    setFilters,
    setSearchQuery,
    tasks,
    toggleTypeFilter,
    totalPages,
  };
}
