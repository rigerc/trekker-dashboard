import { CircleCheck, History, Layers, ListChecks } from 'lucide-react';
import { useMemo } from 'react';

import { Progress } from '@/components/ui/progress';
import type { HistoryResponse } from '@/hooks/use-history';
import { FULL_PERCENTAGE } from '@/lib/constants';
import { isTerminalStatus } from '@/lib/status';
import type { Epic, Task } from '@/types';

interface HistoryStatsProps {
  data: HistoryResponse | undefined;
  epics: Epic[];
  tasks: Task[];
}

function calcCompletionPct(completed: number, total: number): number {
  if (total === 0) return 0;
  return (completed / total) * FULL_PERCENTAGE;
}

export function HistoryStats({ data, epics, tasks }: HistoryStatsProps) {
  const completedCount = useMemo(
    () => tasks.filter((t) => isTerminalStatus(t.status)).length,
    [tasks]
  );
  const completionPct = calcCompletionPct(completedCount, tasks.length);
  const eventCount = data?.total;

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-lg border bg-blue-500/5 p-3">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Events
          </p>
        </div>
        <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
          {eventCount ?? '—'}
        </p>
      </div>
      <div className="rounded-lg border bg-amber-500/5 p-3">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-amber-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Tasks
          </p>
        </div>
        <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
          {tasks.length}
        </p>
      </div>
      <div className="rounded-lg border bg-green-500/5 p-3">
        <div className="flex items-center gap-1.5">
          <CircleCheck className="h-3.5 w-3.5 text-green-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
            Completed
          </p>
        </div>
        <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
          {Math.round(completionPct)}%
        </p>
        <Progress
          value={Math.round(completionPct)}
          className="mt-2 h-1.5"
          indicatorClassName="bg-green-500"
        />
        <p className="mt-1 text-xs text-green-600/70 dark:text-green-400/70">
          {completedCount}/{tasks.length} tasks
        </p>
      </div>
      <div className="rounded-lg border bg-purple-500/5 p-3">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-purple-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Epics
          </p>
        </div>
        <p className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
          {epics.length}
        </p>
      </div>
    </div>
  );
}
