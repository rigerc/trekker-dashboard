'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiFetch } from '@/hooks/api-query';
import { getErrorMessage } from '@/lib/errors';

interface DependencyPayload {
  taskId: string;
  dependsOnId: string;
}

interface RemoveDependencyPayload extends DependencyPayload {
  key: string;
}

async function addDependencyRequest(payload: DependencyPayload) {
  const response = await apiFetch('/api/dependencies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(getErrorMessage(error, 'Could not add dependency'));
  }

  return response.json();
}

async function removeDependencyRequest({ taskId, dependsOnId }: DependencyPayload) {
  const params = new URLSearchParams({ taskId, dependsOnId });
  const response = await apiFetch(`/api/dependencies?${params.toString()}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(getErrorMessage(error, 'Could not remove dependency'));
  }

  return response.json();
}

export function useTaskDependencies() {
  const queryClient = useQueryClient();

  function invalidateTaskQueries() {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }

  const addMutation = useMutation({
    mutationFn: addDependencyRequest,
    onSuccess: invalidateTaskQueries,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not add dependency'));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (payload: RemoveDependencyPayload) => removeDependencyRequest(payload),
    onSuccess: invalidateTaskQueries,
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not remove dependency'));
    },
  });

  return {
    addDependency: addMutation.mutateAsync,
    removeDependency: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    removingKey: removeMutation.variables?.key ?? null,
  };
}
