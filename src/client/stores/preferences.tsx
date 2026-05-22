'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export type CardDensity = 'compact' | 'normal' | 'comfortable';
export type DefaultPage = '/' | '/list' | '/graph' | '/history';
export type DefaultGraphView = 'list' | 'graph';
export type DefaultHistoryView = 'all' | 'tasks' | 'epics' | 'comments' | 'dependencies';

export interface UserPreferences {
  cardDensity: CardDensity;
  defaultPage: DefaultPage;
  defaultGraphView: DefaultGraphView;
  defaultHistoryView: DefaultHistoryView;
  listPageSize: number;
  listDefaultSort: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  cardDensity: 'normal',
  defaultPage: '/',
  defaultGraphView: 'list',
  defaultHistoryView: 'all',
  listPageSize: 20,
  listDefaultSort: 'created:desc',
};

const STORAGE_KEY = 'trekker-preferences';

const LIST_PAGE_SIZE_SMALL = 20;
const LIST_PAGE_SIZE_MEDIUM = 50;
const LIST_PAGE_SIZE_LARGE = 100;
const LIST_PAGE_SIZE_OPTIONS = [
  LIST_PAGE_SIZE_SMALL,
  LIST_PAGE_SIZE_MEDIUM,
  LIST_PAGE_SIZE_LARGE,
] as const;

function isValidListPageSize(value: unknown): value is (typeof LIST_PAGE_SIZE_OPTIONS)[number] {
  return LIST_PAGE_SIZE_OPTIONS.includes(value as (typeof LIST_PAGE_SIZE_OPTIONS)[number]);
}

function parseCardDensity(value: unknown): CardDensity {
  if (value === 'compact' || value === 'comfortable') return value;
  return DEFAULT_PREFERENCES.cardDensity;
}

function parseDefaultPage(value: unknown): DefaultPage {
  if (value === '/list' || value === '/graph' || value === '/history') return value;
  return DEFAULT_PREFERENCES.defaultPage;
}

function parseDefaultGraphView(value: unknown): DefaultGraphView {
  if (value === 'graph') return value;
  return DEFAULT_PREFERENCES.defaultGraphView;
}

function parseDefaultHistoryView(value: unknown): DefaultHistoryView {
  if (value === 'tasks' || value === 'epics' || value === 'comments' || value === 'dependencies') {
    return value;
  }
  return DEFAULT_PREFERENCES.defaultHistoryView;
}

function parseListPageSize(value: unknown): number {
  if (isValidListPageSize(value)) return value;
  return DEFAULT_PREFERENCES.listPageSize;
}

function parseListDefaultSort(value: unknown): string {
  if (typeof value === 'string') return value;
  return DEFAULT_PREFERENCES.listDefaultSort;
}

function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    return {
      cardDensity: parseCardDensity(parsed.cardDensity),
      defaultPage: parseDefaultPage(parsed.defaultPage),
      defaultGraphView: parseDefaultGraphView(parsed.defaultGraphView),
      defaultHistoryView: parseDefaultHistoryView(parsed.defaultHistoryView),
      listPageSize: parseListPageSize(parsed.listPageSize),
      listDefaultSort: parseListDefaultSort(parsed.listDefaultSort),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (updates: Partial<UserPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<UserPreferences>(getStoredPreferences);

  const setPreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferencesState((current) => {
      const next = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = getStoredPreferences();
    setPreferencesState(stored);
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
}
