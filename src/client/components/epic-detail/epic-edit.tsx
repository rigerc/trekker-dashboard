'use client';

import { Circle, Flag } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import type { BreadcrumbItem } from '@/components/breadcrumb';
import type { EpicFormData } from '@/components/epic-detail/schema';
import { EditModalShell, PrioritySelect, StatusSelect } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EPIC_STATUSES } from '@/lib/constants';

const INLINE_TRIGGER =
  'w-auto h-9 border-none shadow-none bg-transparent px-2.5 text-sm hover:bg-accent/60';

interface EpicEditProps {
  form: UseFormReturn<EpicFormData>;
  breadcrumbItems: BreadcrumbItem[];
  open: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSubmit: (data: EpicFormData) => Promise<boolean | undefined>;
  onCancel: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function EpicEdit({
  form,
  breadcrumbItems,
  open,
  isDeleting,
  onClose,
  onSubmit,
  onCancel,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: EpicEditProps) {
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

  const handleFormSubmit = async (data: EpicFormData) => {
    const success = await onSubmit(data);
    if (success) {
      onCancel();
    }
  };

  return (
    <EditModalShell
      open={open}
      onClose={onClose}
      breadcrumbItems={breadcrumbItems}
      formId="epic-edit-form"
      isSubmitting={isSubmitting}
      isDeleting={isDeleting}
      entityName="Epic"
      onCancel={onCancel}
      onDelete={onDelete}
      onDeleteConfirm={onDeleteConfirm}
      onDeleteCancel={onDeleteCancel}
    >
      <form id="epic-edit-form" onSubmit={handleSubmit(handleFormSubmit)} className="p-5">
        <Input
          value={title}
          onChange={(e) => setValue('title', e.target.value)}
          placeholder="Epic title..."
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
                statuses={EPIC_STATUSES}
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
          </div>
        </div>
      </form>
    </EditModalShell>
  );
}
