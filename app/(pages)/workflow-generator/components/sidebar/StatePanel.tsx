"use client";

import type { Edge } from "@xyflow/react";

import type { WorkflowNode } from "../../store/types";

type StatePanelProps = {
  nodes: WorkflowNode[];
  edges: Edge[];
};

export function StatePanel({ nodes, edges }: StatePanelProps) {
  return (
    <div className="flex-grow overflow-auto p-4 text-sm">
      <h3 className="mb-2 font-semibold">Nodes</h3>
      <pre>{JSON.stringify(nodes, null, 2)}</pre>
      <h3 className="mb-2 mt-4 font-semibold">Edges</h3>
      <pre>{JSON.stringify(edges, null, 2)}</pre>
    </div>
  );
}

