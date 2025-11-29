"use client";

import type { WorkflowLayer, WorkflowNode } from "../../store/types";

type ContextPanelProps = {
  activeLayer: WorkflowLayer;
  contracts: {
    id: string;
    title: string;
    flow: WorkflowNode["data"]["flow"];
    spec: WorkflowNode["data"]["spec"];
  }[];
};

export function ContextPanel({ activeLayer, contracts }: ContextPanelProps) {
  return (
    <div className="flex-grow overflow-auto p-4 text-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Active Layer
        </p>
        <p className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)}
        </p>
      </div>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <p className="text-sm font-semibold text-slate-900">
              {contract.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {activeLayer === "flow"
                ? contract.flow.summary
                : activeLayer === "spec"
                ? `${contract.spec.inputs.length} inputs • ${contract.spec.outputs.length} outputs`
                : "Editable code node."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

