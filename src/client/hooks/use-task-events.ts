'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { STATUS_LABELS } from '@/lib/constants';
import { sendNotification } from '@/lib/notifications';
import { useUIStore } from '@/stores';
import { useActiveProjectId } from '@/stores/dashboard-config';

interface TaskCreatedEvent {
  type: 'task_created';
  taskId: string;
  taskTitle: string;
  status: string;
  timestamp: string;
}

interface TaskUpdatedEvent {
  type: 'task_updated';
  taskId: string;
  taskTitle: string;
  status: string;
  timestamp: string;
}

interface TaskDeletedEvent {
  type: 'task_deleted';
  taskId: string;
  taskTitle: string;
  timestamp: string;
}

interface EpicCreatedEvent {
  type: 'epic_created';
  epicId: string;
  epicTitle: string;
  status: string;
  timestamp: string;
}

interface EpicUpdatedEvent {
  type: 'epic_updated';
  epicId: string;
  epicTitle: string;
  status: string;
  timestamp: string;
}

interface EpicDeletedEvent {
  type: 'epic_deleted';
  epicId: string;
  epicTitle: string;
  timestamp: string;
}

interface ConnectedEvent {
  type: 'connected';
}

type SSEEvent =
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskDeletedEvent
  | EpicCreatedEvent
  | EpicUpdatedEvent
  | EpicDeletedEvent
  | ConnectedEvent;

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;
const RETRY_BACKOFF_FACTOR = 2;

export function useTaskEvents(onTaskChange?: () => void) {
  const connectionStatus = useUIStore((state) => state.connectionStatus);
  const activeProjectId = useActiveProjectId();

  const onTaskChangeRef = useRef(onTaskChange);
  onTaskChangeRef.current = onTaskChange;

  useEffect(() => {
    const setStatus = useUIStore.getState().setConnectionStatus;
    let closed = false;
    let retryDelay = INITIAL_RETRY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let eventSource: EventSource | null = null;

    function connect() {
      if (closed) return;
      setStatus('connecting');
      if (!activeProjectId) return;
      eventSource = new EventSource(`/api/events?projectId=${encodeURIComponent(activeProjectId)}`);

      eventSource.onopen = () => {
        if (!closed) {
          setStatus('connected');
          retryDelay = INITIAL_RETRY_MS;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);

          if (data.type === 'connected') {
            if (!closed) setStatus('connected');
            return;
          }

          let title = '';
          let description = '';

          switch (data.type) {
            case 'task_created':
              title = `Task ${data.taskId} created`;
              description = `"${data.taskTitle}"`;
              break;
            case 'task_updated':
              title = `Task ${data.taskId} updated`;
              description = `"${data.taskTitle}" → ${STATUS_LABELS[data.status] || data.status}`;
              break;
            case 'task_deleted':
              title = `Task ${data.taskId} deleted`;
              description = `"${data.taskTitle}"`;
              break;
            case 'epic_created':
              title = `Epic ${data.epicId} created`;
              description = `"${data.epicTitle}"`;
              break;
            case 'epic_updated':
              title = `Epic ${data.epicId} updated`;
              description = `"${data.epicTitle}" → ${STATUS_LABELS[data.status] || data.status}`;
              break;
            case 'epic_deleted':
              title = `Epic ${data.epicId} deleted`;
              description = `"${data.epicTitle}"`;
              break;
          }

          toast.info(title, { description });
          sendNotification({ title, body: description, tag: data.type });
          onTaskChangeRef.current?.();
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        if (closed) return;
        setStatus('disconnected');
        eventSource?.close();
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * RETRY_BACKOFF_FACTOR, MAX_RETRY_MS);
          connect();
        }, retryDelay);
      };
    }

    connect();

    return () => {
      closed = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      eventSource?.close();
      setStatus('disconnected');
    };
  }, [activeProjectId]);

  return { connectionStatus };
}
