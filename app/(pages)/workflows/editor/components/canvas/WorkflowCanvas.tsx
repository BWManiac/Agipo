"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "../../store";
import { StepNode } from "./StepNode";
import { DataEdge } from "./DataEdge";
import type { WorkflowStep } from "@/app/api/workflows/types/workflow-step";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: NodeTypes = {
  stepNode: StepNode as any,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: any = {
  dataEdge: DataEdge,
};

export function WorkflowCanvas() {
  const steps = useWorkflowStore((s) => s.steps);
  const mappings = useWorkflowStore((s) => s.mappings);
  const selectedStepId = useWorkflowStore((s) => s.selectedStepId);
  const setSelectedStep = useWorkflowStore((s) => s.setSelectedStepId);
  const updateStep = useWorkflowStore((s) => s.updateStep);

  // Convert steps to ReactFlow nodes
  const initialNodes: Node[] = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        type: "stepNode",
        position: step.position,
        data: step as unknown as Record<string, unknown>,
        selected: step.id === selectedStepId,
      })),
    [steps, selectedStepId]
  );

  // Convert mappings to ReactFlow edges
  const initialEdges: Edge[] = useMemo(
    () =>
      mappings
        .filter((m) => m.sourceStepId !== "__input__" && m.targetStepId !== "__output__")
        .map((mapping) => ({
          id: mapping.id,
          source: mapping.sourceStepId,
          target: mapping.targetStepId,
          type: "dataEdge",
          data: mapping as unknown as Record<string, unknown>,
          animated: true,
        })),
    [mappings]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedStep(node.id);
    },
    [setSelectedStep]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedStep(null);
  }, [setSelectedStep]);

  // Handle node drag end - update position in store
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateStep(node.id, { position: node.position });
    },
    [updateStep]
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: "dataEdge", animated: true }, eds));
      // TODO: Open mapping modal when edge is created
    },
    [setEdges]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: "dataEdge",
          animated: true,
        }}
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}




