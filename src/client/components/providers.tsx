import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QUERY_STALE_TIME_MS } from '@/lib/constants';
import { ActiveProjectSnapshot, DashboardConfigProvider } from '@/stores/dashboard-config';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" disableTransitionOnChange>
        <DashboardConfigProvider>
          <ActiveProjectSnapshot />
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </DashboardConfigProvider>
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
