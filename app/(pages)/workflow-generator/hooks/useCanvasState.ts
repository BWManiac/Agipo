import { useWorkflowGeneratorStore } from "../store";

/**
 * Manages the core state of the React Flow canvas, including nodes, edges,
 * and the handlers for when they change.
 */
export function useCanvasState() {
  const { nodes, onNodesChange, edges, onEdgesChange, onConnect, addNode } =
    useWorkflowGeneratorStore();

  return {
    nodes,
    onNodesChange,
    edges,
    onEdgesChange,
    onConnect,
    addNode,
  };
}
