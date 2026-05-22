'use client';

import '@xyflow/react/dist/style.css';

import {
  Background,
  BackgroundVariant,
  type Edge,
  MarkerType,
  type Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import dagre from 'dagre';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DependencyFlowNode} from '@/pages/dependency-graph-flow-node';
import { nodeTypes } from '@/pages/dependency-graph-flow-node';
import type { Task } from '@/types';

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

const NODE_W = 220;
const NODE_H = 82;
const HALF = 2;

function buildLayout(tasks: Task[], taskMap: Map<string, Task>) {
  const flowEdges: Edge[] = [];
  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      if (!taskMap.has(depId)) continue;
      flowEdges.push({
        id: `${depId}->${task.id}`,
        source: depId,
        target: task.id,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        label: 'depends on',
        style: { stroke: '#888', strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: '#888' },
      });
    }
  }

  const connectedIds = new Set<string>();
  for (const edge of flowEdges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const id of connectedIds) {
    dagreGraph.setNode(id, { width: NODE_W, height: NODE_H });
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
      position: { x: pos.x - NODE_W / HALF, y: pos.y - NODE_H / HALF },
      data: { task },
    });
  }

  return { nodes: flowNodes, edges: flowEdges };
}

interface DependencyFlowViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function DependencyFlowView({ tasks, onTaskClick }: DependencyFlowViewProps) {
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildLayout(tasks, taskMap),
    [tasks, taskMap]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    setNodes(initNodes);
    setEdges(initEdges);
    setHighlightedId(null);
  }, [initNodes, initEdges, setNodes, setEdges]);

  useEffect(() => {
    if (!highlightedId) {
      setNodes((nds) => nds.map((n) => ({ ...n, style: undefined })));
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: { stroke: '#888', strokeWidth: 1.5 },
          labelStyle: { fontSize: 10, fill: '#888' },
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
        const highlighted = connectedIds.has(e.source) && connectedIds.has(e.target);
        let edgeStyle: React.CSSProperties;
        let edgeLabelStyle: React.CSSProperties;
        if (highlighted) {
          edgeStyle = { stroke: '#888', strokeWidth: 1.5 };
          edgeLabelStyle = { fontSize: 10, fill: '#888' };
        } else {
          edgeStyle = { opacity: 0.2, stroke: '#888', strokeWidth: 1.5 };
          edgeLabelStyle = { opacity: 0.2, fontSize: 10, fill: '#888' };
        }
        return {
          ...e,
          style: edgeStyle,
          labelStyle: edgeLabelStyle,
        };
      })
    );
  }, [highlightedId, taskMap, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const task = (node as DependencyFlowNode).data.task;
      setHighlightedId((prev) => {
        if (prev === node.id) {
          return null;
        }
        return node.id;
      });
      onTaskClick(task);
    },
    [onTaskClick]
  );

  const onPaneClick = useCallback(() => setHighlightedId(null), []);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#888', strokeWidth: 1.5 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
