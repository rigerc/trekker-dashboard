'use client';

import { History } from 'lucide-react';

import { TaskHistoryEventItem } from '@/components/task-detail/history-event-item';
import { useHistory } from '@/hooks/use-history';
import { DEFAULT_HISTORY_PAGE_SIZE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

interface HistoryTabProps {
  taskId: string;
}

export function HistoryTab({ taskId }: HistoryTabProps) {
  const { data, isLoading, error } = useHistory({
    entityId: taskId,
    limit: DEFAULT_HISTORY_PAGE_SIZE,
  });

  if (isLoading) {
    return (
      <div className="p-5">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5">
        <p className="text-sm text-destructive">Error: {getErrorMessage(error, 'Unknown error')}</p>
      </div>
    );
  }

  if (!data?.events.length) {
    return (
      <div className="p-5 flex flex-col items-center justify-center gap-1.5 text-center py-8">
        <History className="h-5 w-5 opacity-40" />
        <p className="text-sm text-muted-foreground">No changes yet</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <h4 className="text-sm font-medium mb-3">History ({data.events.length})</h4>
      <div>
        {data.events.map((event) => (
          <TaskHistoryEventItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
