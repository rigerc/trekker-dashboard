import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateEpicRequest } from '@/components/epic-detail/form-helpers';
import { updateTaskRequest } from '@/components/task-detail/form-helpers';

interface DragStatusUpdateParams {
  type: 'task' | 'epic';
  id: string;
  status: string;
}

export function useDragStatusUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, status }: DragStatusUpdateParams) => {
      if (type === 'task') {
        return updateTaskRequest(id, { status });
      }
      return updateEpicRequest(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['epics'] });
    },
  });
}
