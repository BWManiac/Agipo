"use client";

import { type ReactElement } from "react";

import { Handle, Position } from "@xyflow/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import type { WorkflowNodeData } from "../store/types";
import { CodeContent } from "./code-node/CodeContent";
import { FlowContent } from "./code-node/FlowContent";
import { SpecContent } from "./code-node/SpecContent";

type CodeNodeData = WorkflowNodeData & {
  onChange: (id: string, code: string) => void;
  onFlowChange: (id: string, summary: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onOpenEditor: (id: string) => void;
  activeLayer: "flow" | "spec" | "code";
};

export function CodeNode({
  data,
  selected,
}: {
  data: CodeNodeData;
  selected?: boolean;
}): ReactElement {
  return (
    <Card
      onDoubleClick={(event) => {
        if (
          event.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA", "BUTTON"].includes(event.target.tagName)
        ) {
          return;
        }
        data.onOpenEditor(data.id);
      }}
      style={{
        width: 360,
        borderWidth: data.isRunning || selected ? "2px" : "1px",
        borderColor: data.isRunning
          ? "hsl(var(--primary))"
          : selected
          ? "hsl(var(--primary) / 0.6)"
          : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <CardHeader className="relative">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            data.onOpenEditor(data.id);
          }}
        >
          Edit
        </Button>
        <CardTitle>
          <EditableTitle
            title={data.title || `Node ${data.id}`}
            onChange={(title) => data.onTitleChange(data.id, title)}
          />
        </CardTitle>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {data.activeLayer === "flow"
            ? "Flow"
            : data.activeLayer === "spec"
            ? "Spec"
            : "Code"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.activeLayer === "flow" && <FlowContent data={data} />}
        {data.activeLayer === "spec" && (
          <SpecContent data={data} onOpenEditor={() => data.onOpenEditor(data.id)} />
        )}
        {data.activeLayer === "code" && (
          <div className="space-y-1">
            <Label htmlFor={`code-${data.id}`}>Code</Label>
            <CodeContent data={data} />
          </div>
        )}
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}

function EditableTitle({
  title,
  onChange,
}: {
  title: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={title}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onChange(event.target.value.trim() || title)}
      className="w-full border-none bg-transparent text-left text-lg font-semibold focus:outline-none focus:ring-0"
      onPointerDownCapture={(event) => event.stopPropagation()}
    />
  );
}

