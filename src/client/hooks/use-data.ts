import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/hooks/api-query';
import type { ProjectConfig } from '@/lib/types';
import { useActiveProjectId, useOpenProject } from '@/stores/dashboard-config';
import type { Epic, Project, Task } from '@/types';

// Fetch functions
async function fetchTasks(): Promise<Task[]> {
  const res = await apiFetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

async function fetchEpics(): Promise<Epic[]> {
  const res = await apiFetch('/api/epics');
  if (!res.ok) throw new Error('Failed to fetch epics');
  return res.json();
}

async function fetchProject(): Promise<Project | null> {
  const res = await apiFetch('/api/project');
  if (!res.ok) return null;
  return res.json();
}

// Query hooks
function useTasks() {
  const activeProjectId = useActiveProjectId();
  return useQuery({
    queryKey: ['projects', activeProjectId, 'tasks'],
    queryFn: fetchTasks,
    enabled: Boolean(activeProjectId),
  });
}

function useEpics() {
  const activeProjectId = useActiveProjectId();
  return useQuery({
    queryKey: ['projects', activeProjectId, 'epics'],
    queryFn: fetchEpics,
    enabled: Boolean(activeProjectId),
  });
}

export function useProject() {
  const activeProjectId = useActiveProjectId();
  const openProject = useOpenProject();
  let initialData: Project | undefined;
  if (openProject) {
    initialData = {
      id: openProject.id,
      name: openProject.name,
      config: undefined,
    } as unknown as Project;
  }

  return useQuery({
    queryKey: ['projects', activeProjectId, 'project'],
    queryFn: fetchProject,
    enabled: Boolean(activeProjectId),
    initialData,
  });
}

export function useUpdateProjectConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProjectConfig>) => {
      const res = await apiFetch('/api/project/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update project config');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Combined data hook for the main page
export function useAppData() {
  const tasksQuery = useTasks();
  const epicsQuery = useEpics();

  return {
    tasks: tasksQuery.data ?? [],
    epics: epicsQuery.data ?? [],
    isLoading: tasksQuery.isLoading || epicsQuery.isLoading,
    error: tasksQuery.error || epicsQuery.error,
    refetch: () => {
      tasksQuery.refetch();
      epicsQuery.refetch();
    },
  };
}

export function useBulkArchiveCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/bulk-archive-completed', {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to archive completed items');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
