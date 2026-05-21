import { GitBranch, History, Kanban, List, type LucideIcon } from 'lucide-react';
import { lazy } from 'react';

const KanbanPage = lazy(() =>
  import('@/pages/kanban-page').then((m) => ({ default: m.KanbanPage }))
);
const ListPage = lazy(() => import('@/pages/list-page').then((m) => ({ default: m.ListPage })));
const DependencyGraphPage = lazy(() =>
  import('@/pages/dependency-graph-page').then((m) => ({ default: m.DependencyGraphPage }))
);
const HistoryPage = lazy(() =>
  import('@/pages/history-page').then((m) => ({ default: m.HistoryPage }))
);

interface AppRouteDefinition {
  path: string;
  label: string;
  Icon: LucideIcon;
}

export const APP_ROUTES: AppRouteDefinition[] = [
  {
    path: '/',
    label: 'Kanban',
    Icon: Kanban,
  },
  {
    path: '/list',
    label: 'List',
    Icon: List,
  },
  {
    path: '/graph',
    label: 'Graph',
    Icon: GitBranch,
  },
  {
    path: '/history',
    label: 'History',
    Icon: History,
  },
];

export const ROUTE_PAGES = {
  '/': KanbanPage,
  '/list': ListPage,
  '/graph': DependencyGraphPage,
  '/history': HistoryPage,
} as const;
