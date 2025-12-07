"use client";

import { memo } from "react";
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from "reactflow";

function MappingEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const mappingCount = data?.mappingCount || 0;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: "#8b5cf6",
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {mappingCount > 0 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-full text-xs font-medium text-violet-400">
              {mappingCount} {mappingCount === 1 ? "mapping" : "mappings"}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const MappingEdge = memo(MappingEdgeComponent);

