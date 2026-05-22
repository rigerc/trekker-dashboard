import { useState } from 'react';

import { useAppData } from '@/hooks/use-data';
import { type HistoryEntityType, type HistoryFilters, useHistory } from '@/hooks/use-history';
import { useTaskDetailActions } from '@/hooks/use-task-detail-actions';
import { DEFAULT_HISTORY_PAGE_SIZE } from '@/lib/constants';
import { type DefaultHistoryView, usePreferences } from '@/stores/preferences';

function getDefaultHistoryTypes(view: DefaultHistoryView): HistoryEntityType[] | undefined {
  if (view === 'tasks') return ['task', 'subtask'];
  if (view === 'epics') return ['epic'];
  if (view === 'comments') return ['comment'];
  if (view === 'dependencies') return ['dependency'];
  return undefined;
}

export function useHistoryPageState() {
  const { epics, refetch, tasks } = useAppData();
  const { preferences } = usePreferences();
  const detailActions = useTaskDetailActions(tasks, epics);
  const [filters, setFilters] = useState<HistoryFilters>(() => ({
    limit: DEFAULT_HISTORY_PAGE_SIZE,
    page: 1,
    types: getDefaultHistoryTypes(preferences.defaultHistoryView),
  }));
  const { data, error, isLoading } = useHistory(filters);

  function handleEntityClick(type: HistoryEntityType, id: string) {
    if (type === 'task' || type === 'subtask' || type === 'epic') {
      detailActions.openHistoryEntity(type, id);
    }
  }

  let totalPages = 0;
  if (data) {
    totalPages = Math.ceil(data.total / (filters.limit ?? DEFAULT_HISTORY_PAGE_SIZE));
  }

  return {
    ...detailActions,
    data,
    epics,
    error,
    filters,
    handleEntityClick,
    isLoading,
    refetch,
    setFilters,
    tasks,
    totalPages,
  };
}
