'use client';

import type { FilterOption } from '@/pages/filter-helpers';
import { PageFilterSelect } from '@/pages/page-filter-select';

interface HistoryPageFiltersViewProps {
  actionOptions: readonly FilterOption[];
  actionValue: string;
  sinceValue: string;
  typeOptions: readonly FilterOption[];
  typeValue: string;
  untilValue: string;
  onActionChange: (value: string) => void;
  onSinceChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onUntilChange: (value: string) => void;
}

export function HistoryPageFiltersView({
  actionOptions,
  actionValue,
  sinceValue,
  typeOptions,
  typeValue,
  untilValue,
  onActionChange,
  onSinceChange,
  onTypeChange,
  onUntilChange,
}: HistoryPageFiltersViewProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex w-full sm:contents gap-2">
        <PageFilterSelect
          allLabel="All Types"
          options={typeOptions}
          placeholder="Type"
          value={typeValue}
          widthClassName="flex-1 sm:w-[140px]"
          onValueChange={onTypeChange}
        />

        <PageFilterSelect
          allLabel="All Actions"
          options={actionOptions}
          placeholder="Action"
          value={actionValue}
          widthClassName="flex-1 sm:w-[140px]"
          onValueChange={onActionChange}
        />

        <input
          type="date"
          className="flex-1 sm:flex-none h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-ring/50"
          value={sinceValue}
          onChange={(event) => onSinceChange(event.target.value)}
          placeholder="Since"
        />

        <input
          type="date"
          className="flex-1 sm:flex-none h-9 rounded-md border bg-background px-3 text-sm shadow-xs outline-ring/50"
          value={untilValue}
          onChange={(event) => onUntilChange(event.target.value)}
          placeholder="Until"
        />
      </div>
    </div>
  );
}
