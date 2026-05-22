'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  BackgroundVariant,
  type Edge,
  MarkerType,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import dagre from 'dagre';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { StatusIcon } from '@/components/shared';
import { STATUS_LABELS } from '@/lib/constants';
import type { DependencyFlowNode } from '@/pages/dependency-graph-flow-node';
import { nodeTypes } from '@/pages/dependency-graph-flow-node';
import type { Task } from '@/types';

const DESKTOP_NODE_W = 220;
const DESKTOP_NODE_H = 82;
const DESKTOP_NODE_SEPARATION = 60;
const DESKTOP_RANK_SEPARATION = 80;
const DESKTOP_MARKER_SIZE = 20;
const DESKTOP_STROKE_WIDTH = 1.5;
const DESKTOP_FIT_PADDING = 0.12;
const DESKTOP_MAX_ZOOM = 2;
const DESKTOP_MIN_ZOOM = 0.2;
const DESKTOP_BACKGROUND_GAP = 20;
const MOBILE_NODE_W = 210;
const MOBILE_NODE_H = 82;
const MOBILE_NODE_SEPARATION = 42;
const MOBILE_RANK_SEPARATION = 70;
const MOBILE_MARKER_SIZE = 18;
const MOBILE_STROKE_WIDTH = 1.35;
const MOBILE_FIT_PADDING = 0.02;
const MOBILE_MAX_ZOOM = 1.8;
const MOBILE_MIN_ZOOM = 0.55;
const MOBILE_BACKGROUND_GAP = 18;
const MUTED_OPACITY = 0.2;
const HIDDEN_OPACITY = 0;
const VISIBLE_OPACITY = 1;
const SELECTED_FIT_PADDING = 0.28;
const FIT_DURATION_MS = 180;
const HALF = 2;

function computeConnectedIds(seedId: string, taskMap: Map<string, Task>): Set<string> {
  const connected = new Set<string>();
  const queue = [seedId];
  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined) break;
    if (connected.has(current)) continue;
    connected.add(current);
    const task = taskMap.get(current);
    if (!task) continue;
    for (const depId of task.dependsOn) {
      if (!connected.has(depId)) queue.push(depId);
    }
    for (const blockId of task.blocks) {
      if (!connected.has(blockId)) queue.push(blockId);
    }
  }
  return connected;
}

function useCompactGraph() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');

    function updateCompact() {
      setCompact(mediaQuery.matches);
    }

    updateCompact();
    mediaQuery.addEventListener('change', updateCompact);
    return () => mediaQuery.removeEventListener('change', updateCompact);
  }, []);

  return compact;
}

function getEdgeStyles(compact: boolean, muted = false) {
  let labelOpacity = VISIBLE_OPACITY;
  if (compact) {
    labelOpacity = HIDDEN_OPACITY;
  } else if (muted) {
    labelOpacity = MUTED_OPACITY;
  }

  let edgeOpacity = VISIBLE_OPACITY;
  if (muted) {
    edgeOpacity = MUTED_OPACITY;
  }

  let strokeWidth = DESKTOP_STROKE_WIDTH;
  if (compact) {
    strokeWidth = MOBILE_STROKE_WIDTH;
  }

  return {
    labelStyle: {
      fill: '#888',
      fontSize: 10,
      opacity: labelOpacity,
    },
    style: {
      opacity: edgeOpacity,
      stroke: '#888',
      strokeWidth,
    },
  };
}

function buildLayout(tasks: Task[], taskMap: Map<string, Task>, compact: boolean) {
  const edgeStyles = getEdgeStyles(compact);
  let markerSize = DESKTOP_MARKER_SIZE;
  let edgeLabel: string | undefined = 'depends on';
  if (compact) {
    markerSize = MOBILE_MARKER_SIZE;
    edgeLabel = undefined;
  }

  const flowEdges: Edge[] = [];
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      if (!taskMap.has(depId)) continue;
      flowEdges.push({
        id: `${depId}->${task.id}`,
        source: depId,
        target: task.id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: markerSize,
          height: markerSize,
        },
        label: edgeLabel,
        ...edgeStyles,
      });
    }
  }

  const connectedIds = new Set<string>();
  for (const edge of flowEdges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  let nodeWidth = DESKTOP_NODE_W;
  let nodeHeight = DESKTOP_NODE_H;
  let nodeSeparation = DESKTOP_NODE_SEPARATION;
  let rankSeparation = DESKTOP_RANK_SEPARATION;
  if (compact) {
    nodeWidth = MOBILE_NODE_W;
    nodeHeight = MOBILE_NODE_H;
    nodeSeparation = MOBILE_NODE_SEPARATION;
    rankSeparation = MOBILE_RANK_SEPARATION;
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: nodeSeparation,
    ranksep: rankSeparation,
  });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const id of connectedIds) {
    dagreGraph.setNode(id, { width: nodeWidth, height: nodeHeight });
  }
  for (const edge of flowEdges) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const flowNodes: DependencyFlowNode[] = [];
  for (const task of tasks) {
    if (!connectedIds.has(task.id)) continue;
    const pos = dagreGraph.node(task.id);
    flowNodes.push({
      id: task.id,
      type: 'dependency',
      position: { x: pos.x - nodeWidth / HALF, y: pos.y - nodeHeight / HALF },
      data: { compact, task },
    });
  }

  return { nodes: flowNodes, edges: flowEdges };
}

interface DependencyFlowViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function DependencyFlowView({ tasks, onTaskClick }: DependencyFlowViewProps) {
  const compact = useCompactGraph();
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildLayout(tasks, taskMap, compact),
    [compact, tasks, taskMap]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<DependencyFlowNode> | null>(
    null
  );

  let selectedTask: Task | undefined;
  if (highlightedId) {
    selectedTask = taskMap.get(highlightedId);
  }

  let fitPadding = DESKTOP_FIT_PADDING;
  let maxZoom = DESKTOP_MAX_ZOOM;
  let minZoom = DESKTOP_MIN_ZOOM;
  let backgroundGap = DESKTOP_BACKGROUND_GAP;
  if (compact) {
    fitPadding = MOBILE_FIT_PADDING;
    maxZoom = MOBILE_MAX_ZOOM;
    minZoom = MOBILE_MIN_ZOOM;
    backgroundGap = MOBILE_BACKGROUND_GAP;
  }

  const fitGraph = useCallback(() => {
    flowInstance?.fitView({ duration: FIT_DURATION_MS, padding: fitPadding });
  }, [fitPadding, flowInstance]);

  const fitSelected = useCallback(() => {
    if (!flowInstance || !highlightedId) return;
    flowInstance.fitView({
      duration: FIT_DURATION_MS,
      nodes: [{ id: highlightedId }],
      padding: SELECTED_FIT_PADDING,
    });
  }, [flowInstance, highlightedId]);

  const clearSelection = useCallback(() => setHighlightedId(null), []);

  useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
    setHighlightedId(null);
  }, [initNodes, initEdges, setNodes, setEdges]);

  useEffect(() => {
    if (!flowInstance) return;
    const frame = requestAnimationFrame(() => {
      flowInstance.fitView({ duration: FIT_DURATION_MS, padding: fitPadding });
    });
    return () => cancelAnimationFrame(frame);
  }, [fitPadding, flowInstance, initNodes]);

  useEffect(() => {
    if (!highlightedId) {
      setNodes((nds) => nds.map((n) => ({ ...n, style: undefined })));
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          ...getEdgeStyles(compact),
        }))
      );
      return;
    }

    const connectedIds = computeConnectedIds(highlightedId, taskMap);

    setNodes((nds) =>
      nds.map((n) => {
        let nodeStyle: React.CSSProperties | undefined;
        if (!connectedIds.has(n.id)) {
          nodeStyle = { opacity: 0.2 };
        }
        return { ...n, style: nodeStyle };
      })
    );

    setEdges((eds) =>
      eds.map((e) => {
        const muted = !(connectedIds.has(e.source) && connectedIds.has(e.target));
        return {
          ...e,
          ...getEdgeStyles(compact, muted),
        };
      })
    );
  }, [compact, highlightedId, taskMap, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: DependencyFlowNode) => {
      const task = node.data.task;
      setHighlightedId((prev) => {
        if (prev === node.id) {
          return null;
        }
        return node.id;
      });
      if (!compact) {
        onTaskClick(task);
      }
    },
    [compact, onTaskClick]
  );

  const onPaneClick = useCallback(() => setHighlightedId(null), []);

  return (
    <div className="absolute inset-0">
      <ReactFlow<DependencyFlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onInit={setFlowInstance}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        fitView
        fitViewOptions={{ padding: fitPadding }}
        minZoom={minZoom}
        maxZoom={maxZoom}
        defaultEdgeOptions={{ type: 'smoothstep', ...getEdgeStyles(compact) }}
      >
        <Background variant={BackgroundVariant.Dots} gap={backgroundGap} size={VISIBLE_OPACITY} />
      </ReactFlow>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:hidden">
        {selectedTask && (
          <div className="pointer-events-auto rounded-lg border bg-popover p-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedTask.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono text-foreground/75">{selectedTask.id}</span>
                  <span className="inline-flex items-center gap-1">
                    <StatusIcon status={selectedTask.status} className="h-3.5 w-3.5" />
                    {STATUS_LABELS[selectedTask.status] ?? selectedTask.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onTaskClick(selectedTask)}
              >
                Open task
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Needs {selectedTask.dependsOn.length} · Blocks {selectedTask.blocks.length}
            </p>
          </div>
        )}

        <div className="pointer-events-auto flex items-center justify-center gap-1 rounded-lg border bg-popover/95 p-1 shadow-lg">
          <button
            type="button"
            className="rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={fitGraph}
          >
            Fit
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            disabled={!highlightedId}
            onClick={fitSelected}
          >
            Focus
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            disabled={!highlightedId}
            onClick={clearSelection}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
