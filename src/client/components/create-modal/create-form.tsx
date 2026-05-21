'use client';

import { Circle, Flag, GitBranch, Layers, Tag } from 'lucide-react';
import { useMemo } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import {
  buildEpicOptions,
  buildParentTaskOptions,
} from '@/components/create-modal/create-form.utils';
import type { CreateFormValues } from '@/components/create-modal/schema';
import { PrioritySelect, StatusSelect } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { EPIC_STATUSES, TASK_STATUSES } from '@/lib/constants';
import type { CreateType, Epic, Task } from '@/types';

const INLINE_TRIGGER =
  'w-auto h-9 border-none shadow-none bg-transparent px-2.5 text-sm hover:bg-accent/60';

interface CreateFormProps {
  form: UseFormReturn<CreateFormValues>;
  type: CreateType;
  epics: Epic[];
  parentTasks: Task[];
}

export function CreateForm({ form, type, epics, parentTasks }: CreateFormProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const status = watch('status');
  const priority = watch('priority');

  const epicOptions = useMemo(() => buildEpicOptions(epics), [epics]);
  const taskOptions = useMemo(() => buildParentTaskOptions(parentTasks), [parentTasks]);

  let statusOptions: readonly string[] = TASK_STATUSES;
  if (type === 'epic') {
    statusOptions = EPIC_STATUSES;
  }

  let titlePlaceholder = 'Task title...';
  if (type === 'epic') {
    titlePlaceholder = 'Epic title...';
  } else if (type === 'subtask') {
    titlePlaceholder = 'Subtask title...';
  }

  return (
    <div className="flex flex-col">
      <Input
        {...register('title')}
        placeholder={titlePlaceholder}
        autoFocus
        className="h-auto border-none shadow-none bg-transparent px-0 text-xl font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0"
      />
      {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}

      <Textarea
        {...register('description')}
        placeholder="Add a description..."
        rows={3}
        className="mt-4 min-h-0 border-none shadow-none bg-transparent px-0 py-1 resize-none text-sm leading-6 placeholder:text-muted-foreground/40 focus-visible:ring-0"
      />

      <div className="mt-5 border-t pt-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          Properties
        </p>
        <div className="divide-y">
          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Circle className="h-3.5 w-3.5" />
              Status
            </span>
            <StatusSelect
              value={status}
              onChange={(v) => setValue('status', v)}
              statuses={statusOptions}
              triggerClassName={INLINE_TRIGGER}
            />
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flag className="h-3.5 w-3.5" />
              Priority
            </span>
            <PrioritySelect
              value={priority}
              onChange={(v) => setValue('priority', v)}
              triggerClassName={INLINE_TRIGGER}
            />
          </div>

          {type === 'task' && (
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Epic
              </span>
              <Controller
                control={control}
                name="epicId"
                render={({ field }) => (
                  <SearchableSelect
                    className="w-48"
                    options={epicOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="No Epic"
                    emptyText="No epics found"
                  />
                )}
              />
            </div>
          )}

          {type === 'subtask' && (
            <div className="flex flex-col gap-1 py-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GitBranch className="h-3.5 w-3.5" />
                  Parent Task
                  <span className="text-destructive">*</span>
                </span>
                <Controller
                  control={control}
                  name="parentTaskId"
                  render={({ field }) => (
                    <SearchableSelect
                      className="w-48"
                      options={taskOptions}
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? '')}
                      placeholder="Select a task..."
                      emptyText="No tasks found"
                    />
                  )}
                />
              </div>
              {errors.parentTaskId?.message && (
                <p className="text-xs text-destructive">{errors.parentTaskId.message}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between py-2.5">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </span>
            <Input
              {...register('tags')}
              placeholder="bug, frontend..."
              className="w-48 h-9 border-none shadow-none bg-transparent px-2.5 text-sm text-right placeholder:text-muted-foreground/40 focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
