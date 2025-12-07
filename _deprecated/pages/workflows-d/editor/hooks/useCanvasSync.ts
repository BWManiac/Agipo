"use client";

import { useEffect } from "react";
import type { Node, Edge } from "reactflow";

/**
 * Hook to sync ReactFlow state with external node/edge data
 */
export function useCanvasSync(
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) {
  // Sync nodes when external data changes
  useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  // Sync edges when external data changes
  useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);
}
