'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects, useProjectSuggestions } from '@/stores/dashboard-config';

export function OnboardingPage() {
  const [scanRoot, setScanRoot] = useState('');
  const [manualDbPath, setManualDbPath] = useState('');
  const [submittedScanRoot, setSubmittedScanRoot] = useState<string | null>(null);
  const [addingDbPath, setAddingDbPath] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const { addProject, isAddingProject } = useProjects();
  let normalizedSubmittedScanRoot: string | undefined;
  if (submittedScanRoot !== null) {
    normalizedSubmittedScanRoot = submittedScanRoot;
  }
  const suggestions = useProjectSuggestions(normalizedSubmittedScanRoot, submittedScanRoot !== null);

  const addProjectWithFeedback = async (input: { dbPath: string; name?: string }) => {
    setAddError(null);
    setAddingDbPath(input.dbPath);
    try {
      await addProject(input);
    } catch (error) {
      let message = 'Failed to add project';
      if (error instanceof Error) {
        message = error.message;
      }
      setAddError(message);
    } finally {
      setAddingDbPath(null);
    }
  };

  let scanError: string | null = null;
  if (suggestions.error instanceof Error) {
    scanError = suggestions.error.message;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Welcome to Trekker Dashboard</h1>
          <p className="text-muted-foreground">
            Add a Trekker database to start. Discovered databases are suggestions and are not added
            automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={scanRoot}
            onChange={(event) => setScanRoot(event.target.value)}
            placeholder="Scan root (optional)"
          />
          <Button
            onClick={() => setSubmittedScanRoot(scanRoot.trim())}
            disabled={suggestions.isFetching}
            loading={suggestions.isFetching}
            loadingText="Scanning…"
          >
            Scan
          </Button>
        </div>
        {scanError && <p className="text-sm text-destructive">{scanError}</p>}
        {addError && <p className="text-sm text-destructive">{addError}</p>}
        {suggestions.data?.limitReached && (
          <p className="text-sm text-amber-600">
            Scan limit reached. Narrow the root or add a database manually.
          </p>
        )}
        <div className="space-y-2">
          {suggestions.data?.suggestions.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between gap-3 rounded border p-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{project.name}</div>
                <div className="truncate text-xs text-muted-foreground">{project.dbPath}</div>
              </div>
              <Button
                onClick={() =>
                  addProjectWithFeedback({ dbPath: project.dbPath, name: project.name })
                }
                disabled={isAddingProject}
              >
                {addingDbPath === project.dbPath && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {addingDbPath === project.dbPath && 'Adding…'}
                {addingDbPath !== project.dbPath && 'Add'}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t pt-4">
          <Input
            value={manualDbPath}
            onChange={(event) => setManualDbPath(event.target.value)}
            placeholder="Manual .trekker/trekker.db path"
          />
          <Button
            onClick={() => manualDbPath && addProjectWithFeedback({ dbPath: manualDbPath })}
            disabled={isAddingProject || !manualDbPath.trim()}
          >
            {addingDbPath === manualDbPath && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {addingDbPath === manualDbPath && 'Adding…'}
            {addingDbPath !== manualDbPath && 'Add path'}
          </Button>
        </div>
      </div>
    </main>
  );
}
