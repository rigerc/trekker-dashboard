'use client';

import { GitBranch, Layers, SquareCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CreateForm } from '@/components/create-modal/create-form';
import { useCreateForm } from '@/components/create-modal/use-create-form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { CreateType, Epic, Task } from '@/types';

interface CreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  epics: Epic[];
  tasks: Task[];
  defaultStatus?: string;
  defaultType?: CreateType;
}

const TYPE_OPTIONS = [
  { value: 'epic', label: 'Epic', icon: Layers },
  { value: 'task', label: 'Task', icon: SquareCheck },
  { value: 'subtask', label: 'Subtask', icon: GitBranch },
] as const;

export function CreateModal({
  open,
  onClose,
  onCreated,
  epics,
  tasks,
  defaultStatus,
  defaultType,
}: CreateDrawerProps) {
  const [type, setType] = useState<CreateType>('task');
  const parentTasks = tasks.filter((t) => !t.parentTaskId);

  const { form, isSubmitting, handleSubmit } = useCreateForm({
    type,
    defaultStatus,
    onClose,
    onCreated,
  });

  useEffect(() => {
    if (open) {
      setType(defaultType || 'task');
    }
  }, [open, defaultType]);

  let typeLabel = 'Task';
  const found = TYPE_OPTIONS.find((t) => t.value === type);
  if (found) {
    typeLabel = found.label;
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="p-0 flex flex-col w-full sm:max-w-md gap-0">
        <SheetHeader className="shrink-0 border-b px-5 pt-4 pb-3 space-y-3">
          <SheetTitle className="text-base">New {typeLabel}</SheetTitle>

          <div className="flex gap-0.5 rounded-lg bg-muted p-1">
            {TYPE_OPTIONS.map(({ value, label, icon: TypeIcon }) => {
              const isActive = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value as CreateType)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive && 'bg-background text-foreground shadow-sm',
                    !isActive && 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0" showScrollbar>
          <form id="create-form" onSubmit={handleSubmit} className="p-5">
            <CreateForm
              key={type}
              form={form}
              type={type}
              epics={epics}
              parentTasks={parentTasks}
            />
          </form>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-form"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Creating"
          >
            Create {typeLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
