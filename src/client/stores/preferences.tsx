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
  groupRelatedWork: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  cardDensity: 'normal',
  defaultPage: '/',
  defaultGraphView: 'list',
  defaultHistoryView: 'all',
  listPageSize: 20,
  listDefaultSort: 'created:desc',
  groupRelatedWork: false,
};

export {
  DashboardConfigProvider as PreferencesProvider,
  usePreferences,
} from '@/stores/dashboard-config';
