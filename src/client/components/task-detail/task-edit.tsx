'use client';

import { Circle, Flag, Layers, Tag } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { BreadcrumbItem } from '@/components/breadcrumb';
import { EditModalShell, PrioritySelect, StatusSelect } from '@/components/shared';
import type { TaskFormData } from '@/components/task-detail/schema';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TASK_STATUSES } from '@/lib/constants';
import type { Epic } from '@/types';

const INLINE_TRIGGER =
  'w-auto h-9 border-none shadow-none bg-transparent px-2.5 text-sm hover:bg-accent/60';

interface TaskEditProps {
  form: UseFormReturn<TaskFormData>;
  epics: Epic[];
  breadcrumbItems: BreadcrumbItem[];
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<boolean | undefined>;
  onCancel: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function TaskEdit({
  form,
  epics,
  breadcrumbItems,
  open,
  isDeleting,
  onClose,
  onSubmit,
  onCancel,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: TaskEditProps) {
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;
  const title = watch('title');
  const description = watch('description');
  const status = watch('status');
  const priority = watch('priority');
  const tags = watch('tags');
  const epicId = watch('epicId');

  const handleFormSubmit = async (data: TaskFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  const handleEpicChange = (value: string) => {
    if (value === 'none') {
      setValue('epicId', null);
      return;
    }
    setValue('epicId', value);
  };

  return (
    <EditModalShell
      open={open}
      onClose={onClose}
      breadcrumbItems={breadcrumbItems}
      formId="task-edit-form"
      isSubmitting={isSubmitting}
      isDeleting={isDeleting}
      entityName="Task"
      onCancel={onCancel}
      onDelete={onDelete}
      onDeleteConfirm={onDeleteConfirm}
      onDeleteCancel={onDeleteCancel}
    >
      <form id="task-edit-form" onSubmit={handleSubmit(handleFormSubmit)} className="p-5">
        <Input
          value={title}
          onChange={(e) => setValue('title', e.target.value)}
          placeholder="Task title..."
          className="h-auto border-none shadow-none bg-transparent px-0 text-xl font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0"
        />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}

        <Textarea
          value={description}
          onChange={(e) => setValue('description', e.target.value)}
          placeholder="Add a description..."
          rows={4}
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
                statuses={TASK_STATUSES}
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

            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Epic
              </span>
              <Select value={epicId || 'none'} onValueChange={handleEpicChange}>
                <SelectTrigger className={INLINE_TRIGGER}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Epic</SelectItem>
                  {epics.map((epic) => (
                    <SelectItem key={epic.id} value={epic.id}>
                      {epic.id}: {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </span>
              <Input
                value={tags}
                onChange={(e) => setValue('tags', e.target.value)}
                placeholder="bug, frontend..."
                className="w-48 h-9 border-none shadow-none bg-transparent px-2.5 text-sm text-right placeholder:text-muted-foreground/40 focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </form>
    </EditModalShell>
  );
}
