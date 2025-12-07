"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  NodeChange,
  applyNodeChanges,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowsDStore } from "../../store";
import { StepNode } from "./StepNode";
import { useCanvasSync } from "../../hooks/useCanvasSync";

// Custom node types
const nodeTypes = {
  step: StepNode,
};

export function CanvasView() {
  const { steps, mappings, updateStep, setSelectedStep } = useWorkflowsDStore();

  // Convert steps to ReactFlow nodes
  const initialNodes: Node[] = useMemo(() => {
    return steps.map((step) => ({
      id: step.id,
      type: "step",
      position: step.position,
      data: {
        step,
      },
    }));
  }, [steps]);

  // Convert mappings to ReactFlow edges
  const initialEdges: Edge[] = useMemo(() => {
    return mappings
      .filter((m) => m.sourceStepId !== "__input__" && m.targetStepId !== "__output__")
      .map((mapping) => ({
        id: mapping.id,
        source: mapping.sourceStepId,
        target: mapping.targetStepId,
        type: "default",
        animated: true,
        style: { stroke: "#8b5cf6", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#8b5cf6",
        },
      }));
  }, [mappings]);

  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Sync with store
  useCanvasSync(initialNodes, initialEdges, setNodes, setEdges);

  // Handle node position changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));

      // Update step positions in store when drag ends
      changes.forEach((change) => {
        if (change.type === "position" && change.dragging === false && change.position) {
          updateStep(change.id, { position: change.position });
        }
      });
    },
    [setNodes, updateStep]
  );

  // Handle new connections (placeholder - opens mapping editor in future)
  const onConnect = useCallback(
    (params: Connection) => {
      // For now, just add a visual edge
      // TODO: Open mapping editor for the target step
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#8b5cf6", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#8b5cf6",
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

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

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#8b5cf6", strokeWidth: 2 },
        }}
        className="bg-slate-950"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#334155"
        />
        <Controls 
          className="!bg-slate-800/80 !border-white/10 !rounded-xl !shadow-lg"
          showZoom
          showFitView
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-slate-800/80 !border-white/10 !rounded-xl"
          nodeColor="#8b5cf6"
          maskColor="rgba(0, 0, 0, 0.5)"
        />
      </ReactFlow>
    </div>
  );
}



