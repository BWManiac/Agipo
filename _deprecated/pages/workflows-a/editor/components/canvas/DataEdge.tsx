"use client";

import { memo } from "react";
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { DataMapping } from "@/app/api/workflows/services/types";

interface DataEdgeData {
  data?: DataMapping;
}

export const DataEdge = memo(function DataEdge({
  id,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: EdgeProps<any>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const mapping = data?.data;
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




