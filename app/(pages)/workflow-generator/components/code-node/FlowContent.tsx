"use client";

import { Textarea } from "@/components/ui/textarea";

import type { WorkflowNodeData } from "../../store/types";

type FlowContentProps = {
  data: WorkflowNodeData & {
    onFlowChange: (id: string, summary: string) => void;
  };
};

export function FlowContent({ data }: FlowContentProps) {
  return (
    <div className="space-y-2 text-sm text-slate-600">
      <p className="font-medium text-slate-500">Flow</p>
      <Textarea
        value={data.flow.summary}
        onChange={(event) => data.onFlowChange(data.id, event.target.value)}
        placeholder="Describe what happens in this step."
        className="min-h-[120px] resize-y nodrag"
        style={{ resize: "vertical" }}
        onPointerDownCapture={(event) => event.stopPropagation()}
      />
    </div>
  );
}

