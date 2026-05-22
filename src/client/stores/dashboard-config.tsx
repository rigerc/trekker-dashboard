'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';

import { DEFAULT_PREFERENCES, type UserPreferences } from '@/stores/preferences';

export interface DashboardProject {
  id: string;
  name: string;
  path?: string;
  dbPath: string;
  isOpen?: boolean;
  unavailable?: boolean;
  lastOpenedAt?: string | null;
}

export interface SuggestedProject {
  id: string;
  name: string;
  path?: string;
  dbPath: string;
}

export interface DashboardConfig {
  preferences: UserPreferences;
  projects: DashboardProject[];
  openProjectId: string | null;
  scanRoots?: string[];
}

interface DashboardConfigContextValue {
  config: DashboardConfig | undefined;
  isConfigLoading: boolean;
  preferences: UserPreferences;
  setPreferences: (updates: Partial<UserPreferences>) => void;
  projects: DashboardProject[];
  openProject: DashboardProject | undefined;
  activeProjectId: string | null;
}

const LEGACY_STORAGE_KEY = 'trekker-preferences';
const MIGRATION_STORAGE_KEY = 'trekker-dashboard-preferences-migrated';

const DashboardConfigContext = createContext<DashboardConfigContextValue | undefined>(undefined);

function fallbackConfig(): DashboardConfig {
  return { preferences: DEFAULT_PREFERENCES, projects: [], openProjectId: null };
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(error.error || fallbackMessage);
  }
  return response.json();
}

async function fetchDashboardConfig(): Promise<DashboardConfig> {
  const response = await fetch('/api/dashboard-config');
  return parseJsonResponse(response, 'Failed to fetch dashboard config');
}

async function patchDashboardConfig(updates: Partial<DashboardConfig>): Promise<DashboardConfig> {
  const response = await fetch('/api/dashboard-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return parseJsonResponse(response, 'Failed to update dashboard config');
}

function readLegacyPreferences(): Partial<UserPreferences> | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem(MIGRATION_STORAGE_KEY) === 'true') return null;

  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Partial<UserPreferences>;
  } catch {
    return null;
  }
}

export function DashboardConfigProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['dashboard-config'], queryFn: fetchDashboardConfig });
  const mutation = useMutation({
    mutationFn: patchDashboardConfig,
    onSuccess: (data) => queryClient.setQueryData(['dashboard-config'], data),
  });

  const config = query.data ?? fallbackConfig();

  useEffect(() => {
    if (!query.data) return;
    const legacyPreferences = readLegacyPreferences();
    if (!legacyPreferences) return;

    mutation.mutate({ preferences: { ...query.data.preferences, ...legacyPreferences } });
    localStorage.setItem(MIGRATION_STORAGE_KEY, 'true');
  }, [mutation, query.data]);

  const setPreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      const nextPreferences = { ...config.preferences, ...updates };
      queryClient.setQueryData<DashboardConfig>(['dashboard-config'], (current) => ({
        ...(current ?? fallbackConfig()),
        preferences: nextPreferences,
      }));
      mutation.mutate({ preferences: nextPreferences });
    },
    [config.preferences, mutation, queryClient]
  );

  const value = useMemo<DashboardConfigContextValue>(() => {
    const projects = config.projects ?? [];
    const activeProjectId =
      config.openProjectId ?? projects.find((project) => project.isOpen)?.id ?? null;
    return {
      config,
      isConfigLoading: query.isLoading,
      preferences: config.preferences ?? DEFAULT_PREFERENCES,
      setPreferences,
      projects,
      openProject: projects.find((project) => project.id === activeProjectId),
      activeProjectId,
    };
  }, [config, query.isLoading, setPreferences]);

  return (
    <DashboardConfigContext.Provider value={value}>{children}</DashboardConfigContext.Provider>
  );
}

export function useDashboardConfig() {
  const context = useContext(DashboardConfigContext);
  if (!context) throw new Error('useDashboardConfig must be used within a DashboardConfigProvider');
  return context;
}

export function usePreferences() {
  const { preferences, setPreferences } = useDashboardConfig();
  return { preferences, setPreferences };
}

export function useProjects() {
  const queryClient = useQueryClient();
  const context = useDashboardConfig();
  const openMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/open`, {
        method: 'PATCH',
      });
      return parseJsonResponse<DashboardConfig>(response, 'Failed to open project');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboard-config'], data);
      queryClient.invalidateQueries();
    },
  });
  const addMutation = useMutation({
    mutationFn: async (input: { dbPath: string; name?: string }) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      return parseJsonResponse<DashboardConfig>(response, 'Failed to add project');
    },
    onSuccess: (data) => queryClient.setQueryData(['dashboard-config'], data),
  });
  const removeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
      });
      return parseJsonResponse<DashboardConfig>(response, 'Failed to remove project');
    },
    onSuccess: (data) => queryClient.setQueryData(['dashboard-config'], data),
  });

  return {
    ...context,
    openProject: openMutation.mutate,
    addProject: addMutation.mutate,
    removeProject: removeMutation.mutate,
  };
}

export function useProjectSuggestions(scanRoot?: string, enabled = true) {
  return useQuery({
    queryKey: ['project-suggestions', scanRoot],
    enabled,
    queryFn: async () => {
      const search = new URLSearchParams();
      if (scanRoot) search.set('root', scanRoot);
      const query = search.toString();
      let url = '/api/projects/discovered';
      if (query) {
        url = `${url}?${query}`;
      }
      const response = await fetch(url);
      return parseJsonResponse<{ suggestions: SuggestedProject[]; limitReached?: boolean }>(
        response,
        'Failed to discover projects'
      );
    },
  });
}

export function useActiveProjectId() {
  return useDashboardConfig().activeProjectId;
}

export function useOpenProject() {
  return useDashboardConfig().openProject;
}

export function getActiveProjectIdSnapshot(): string | null {
  return (
    (window as unknown as { __TREKKER_ACTIVE_PROJECT_ID__?: string | null })
      .__TREKKER_ACTIVE_PROJECT_ID__ ?? null
  );
}

export function ActiveProjectSnapshot() {
  const activeProjectId = useActiveProjectId();
  useEffect(() => {
    (
      window as unknown as { __TREKKER_ACTIVE_PROJECT_ID__?: string | null }
    ).__TREKKER_ACTIVE_PROJECT_ID__ = activeProjectId;
  }, [activeProjectId]);
  return null;
}
