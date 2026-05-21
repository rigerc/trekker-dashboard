import { GitBranch, History, Kanban, List, type LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

import { DependencyGraphPage, HistoryPage, KanbanPage, ListPage } from '@/pages';

interface AppRouteDefinition {
  path: string;
  label: string;
  Icon: LucideIcon;
  Page: ComponentType<Record<string, never>>;
}

export const APP_ROUTES: AppRouteDefinition[] = [
  {
    path: '/',
    label: 'Kanban',
    Icon: Kanban,
    Page: KanbanPage,
  },
  {
    path: '/list',
    label: 'List',
    Icon: List,
    Page: ListPage,
  },
  {
    path: '/graph',
    label: 'Graph',
    Icon: GitBranch,
    Page: DependencyGraphPage,
  },
  {
    path: '/history',
    label: 'History',
    Icon: History,
    Page: HistoryPage,
  },
];
