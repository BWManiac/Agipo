"use client";

import { memo } from "react";
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { cn } from "@/lib/utils";

export const DataEdge = memo(function DataEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const mapping = data as { fieldMappings?: unknown[] } | undefined;
  const fieldCount = mapping?.fieldMappings?.length || 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? "var(--primary)" : "#94a3b8",
        }}
      />
      {fieldCount > 0 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              "bg-white border shadow-sm",
              selected ? "border-primary text-primary" : "border-slate-200 text-slate-500"
            )}
          >
            {fieldCount} {fieldCount === 1 ? "field" : "fields"}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
