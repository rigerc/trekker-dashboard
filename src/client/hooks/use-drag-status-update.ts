import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateEpicRequest } from '@/components/epic-detail/form-helpers';
import { updateTaskRequest } from '@/components/task-detail/form-helpers';

interface DragStatusUpdateParams {
  type: 'task' | 'epic';
  id: string;
  status?: string;
  priority?: number;
}

export function useDragStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, status, priority }: DragStatusUpdateParams) => {
      if (type === 'task') {
        return updateTaskRequest(id, { status, priority });
      }
      return updateEpicRequest(id, { status, priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['epics'] });
    },
  });
}
