"use client";

import { Textarea } from "@/components/ui/textarea";

import type { WorkflowNodeData } from "../../store/types";

type CodeContentProps = {
  data: WorkflowNodeData & {
    onChange: (id: string, code: string) => void;
  };
};

export function CodeContent({ data }: CodeContentProps) {
  return (
    <div className="grid w-full gap-1.5">
      <Textarea
        id={`code-${data.id}`}
        defaultValue={data.code}
        onChange={(event) => data.onChange(data.id, event.target.value)}
        className="nodrag"
        style={{ resize: "vertical" }}
        onPointerDownCapture={(event) => event.stopPropagation()}
      />
    </div>
  );
}

