import { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { APP_ROUTES, ROUTE_PAGES } from '@/app-routes';
import { AppHeader } from '@/components/app-header';
import { CreateModal } from '@/components/create-modal';
import { ConnectionIndicator } from '@/components/shared/connection-indicator';
import { useAppData, useProject } from '@/hooks/use-data';
import { useUIStore } from '@/stores';
import { usePreferences } from '@/stores/preferences';

export function App() {
  const location = useLocation();
  const { preferences } = usePreferences();
  const { tasks, epics, refetch } = useAppData();
  const { data: project } = useProject();
  const {
    connectionStatus,
    showCreateModal,
    createModalDefaults,
    openCreateModal,
    closeCreateModal,
  } = useUIStore();
  const showConnectionIndicator = location.pathname === '/';

  if (location.pathname === '/' && preferences.defaultPage !== '/') {
    return <Navigate to={preferences.defaultPage} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader
        projectName={project?.name}
        projectConfig={project?.config}
        onNewClick={() => openCreateModal({ status: 'todo' })}
      />

      <Routes>
        {APP_ROUTES.map(({ path }) => {
          const Page = ROUTE_PAGES[path as keyof typeof ROUTE_PAGES];
          return (
            <Route
              key={path}
              path={path}
              element={
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center flex-1 p-8">
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  }
                >
                  <Page />
                </Suspense>
              }
            />
          );
        })}
      </Routes>

      <footer className="px-4 py-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {tasks.length} tasks across {epics.length} epics
          </span>
          {showConnectionIndicator && <ConnectionIndicator status={connectionStatus} />}
        </div>
      </footer>

      <CreateModal
        open={showCreateModal}
        onClose={closeCreateModal}
        onCreated={refetch}
        epics={epics}
        tasks={tasks}
        defaultStatus={createModalDefaults.status || 'todo'}
      />
    </div>
  );
}
