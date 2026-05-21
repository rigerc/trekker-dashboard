'use client';

import { PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';

import { getErrorMessage } from '@/lib/errors';

interface PageResultsFrameProps {
  content: ReactNode;
  emptyMessage: string;
  error: unknown;
  isEmpty: boolean;
  isLoading: boolean;
}

export function PageResultsFrame({
  content,
  emptyMessage,
  error,
  isEmpty,
  isLoading,
}: PageResultsFrameProps) {
  let frameContent = content;

  if (isEmpty) {
    frameContent = (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <PackageOpen className="h-8 w-8 opacity-40" />
        <span className="text-sm text-muted-foreground">{emptyMessage}</span>
      </div>
    );
  }

  if (error) {
    frameContent = (
      <div className="flex h-full items-center justify-center">
        <span className="text-destructive">Error: {getErrorMessage(error, 'Unknown error')}</span>
      </div>
    );
  }

  if (isLoading) {
    frameContent = (
      <div className="flex h-full items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return <div className="flex-1 overflow-auto rounded-lg border">{frameContent}</div>;
}
