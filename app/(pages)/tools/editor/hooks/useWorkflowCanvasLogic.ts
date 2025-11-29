import { useMemo, useCallback } from "react";
import type { EdgeMouseHandler } from "@xyflow/react";

import { useWorkflowGeneratorStore } from "../store";
import type { MatchResult, EdgeFieldRef } from "../types/domain";
import { CodeNode } from "../components/CodeNode";

/**
 * This hook contains the complex "display logic" for the workflow canvas.
 * It takes raw state from other hooks and computes the derived values and
 * event handlers that the React Flow canvas and its child components need.
 * This keeps the main `page.tsx` component clean and focused on layout.
 */
export function useWorkflowCanvasLogic() {
  // Select primitive values and functions individually for stability.
  // This prevents re-renders caused by creating new objects on every call.
  const nodes = useWorkflowGeneratorStore((state) => state.nodes);
  const edges = useWorkflowGeneratorStore((state) => state.edges);
  const activeLayer = useWorkflowGeneratorStore((state) => state.activeLayer);
  const editingNodeId = useWorkflowGeneratorStore(
    (state) => state.editingNodeId
  );
  const activeEdgeId = useWorkflowGeneratorStore((state) => state.activeEdgeId);
  const mappings = useWorkflowGeneratorStore((state) => state.mappings);
  const openEditor = useWorkflowGeneratorStore((state) => state.openEditor);
  const setSidebarTab = useWorkflowGeneratorStore((state) => state.setSidebarTab);
  const setActiveEdge = useWorkflowGeneratorStore((state) => state.setActiveEdge);
  const linkFields = useWorkflowGeneratorStore((state) => state.linkFields);
  const unlinkField = useWorkflowGeneratorStore((state) => state.unlinkField);
  const setStaticValue = useWorkflowGeneratorStore(
    (state) => state.setStaticValue
  );
  const updateNodeCode = useWorkflowGeneratorStore(
    (state) => state.updateNodeCode
  );
  const updateNodeFlowSummary = useWorkflowGeneratorStore(
    (state) => state.updateNodeFlowSummary
  );
  const updateNodeTitle = useWorkflowGeneratorStore(
    (state) => state.updateNodeTitle
  );

  const nodeTypes = useMemo(() => ({ code: CodeNode }), []);

  const handleOpenEditor = useCallback(
    (nodeId: string) => {
      // Switching focus to a node should deactivate any active edge editor.
      setActiveEdge(null);
      openEditor(nodeId);
      setSidebarTab("editor");
    },
    [openEditor, setActiveEdge, setSidebarTab]
  );

  const augmentedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === editingNodeId,
        data: {
          ...node.data,
          onChange: updateNodeCode,
          onFlowChange: updateNodeFlowSummary,
          onTitleChange: updateNodeTitle,
          onOpenEditor: handleOpenEditor,
          activeLayer,
        },
      })),
    [
      nodes,
      editingNodeId,
      activeLayer,
      handleOpenEditor,
      updateNodeCode,
      updateNodeFlowSummary,
      updateNodeTitle,
    ]
  );

  const contracts = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        title: node.data.title,
        flow: node.data.flow,
        spec: node.data.spec,
      })),
    [nodes]
  );

  const editingNode = useMemo(
    () => nodes.find((node) => node.id === editingNodeId) ?? null,
    [nodes, editingNodeId]
  );

  const activeEdge = useMemo(
    () => edges.find((edge) => edge.id === activeEdgeId) ?? null,
    [edges, activeEdgeId]
  );

  const edgeSourceNode = useMemo(
    () =>
      activeEdge
        ? nodes.find((node) => node.id === activeEdge.source) ?? null
        : null,
    [activeEdge, nodes]
  );

  const edgeTargetNode = useMemo(
    () =>
      activeEdge
        ? nodes.find((node) => node.id === activeEdge.target) ?? null
        : null,
    [activeEdge, nodes]
  );

  const edgeMapping = activeEdgeId ? mappings[activeEdgeId] : undefined;

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setSidebarTab("editor");
      setActiveEdge(edge.id);
    },
    [setActiveEdge, setSidebarTab]
  );

  const handleLinkEdge = useCallback(
    (from: EdgeFieldRef | undefined, to: EdgeFieldRef) => {
      if (!activeEdgeId) {
        return {
          status: "warning",
          reason: "missing-downstream",
        } as MatchResult;
      }
      return linkFields(activeEdgeId, from, to);
    },
    [activeEdgeId, linkFields]
  );

  const handleUnlinkEdge = useCallback(
    (to: EdgeFieldRef) => {
      if (!activeEdgeId) return;
      unlinkField(activeEdgeId, to);
    },
    [activeEdgeId, unlinkField]
  );

  const handleStaticValue = useCallback(
    (to: EdgeFieldRef, value: string) => {
      if (!activeEdgeId) return;
      setStaticValue(activeEdgeId, to, value);
    },
    [activeEdgeId, setStaticValue]
  );

  const handleCanvasClick = useCallback(() => {
    // Clicking empty canvas space should clear the edge selection.
    setActiveEdge(null);
  }, [setActiveEdge]);

  return {
    nodeTypes,
    augmentedNodes,
    contracts,
    editingNode,
    activeEdge,
    edgeSourceNode,
    edgeTargetNode,
    edgeMapping,
    handleEdgeClick,
    handleLinkEdge,
    handleUnlinkEdge,
    handleStaticValue,
    handleCanvasClick,
  };
}
