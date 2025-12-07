"use client";

import type { ParallelLane as ParallelLaneType } from "@/app/api/workflows/types/execution-flow";
import { useWorkflowStore } from "../../../store";
import { RailNode } from "../RailNode";
import { SortableStep } from "../../drag-and-drop/SortableStep";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface ParallelLaneProps {
  parallelStepId: string;
  laneIndex: number;
  lane: ParallelLaneType;
}

/**
 * Individual parallel lane.
 * Shows lane label (A, B, C) and provides drop zone for steps.
 */
export function ParallelLane({
  parallelStepId,
  laneIndex,
  lane,
}: ParallelLaneProps) {
  const getChildStepsForLane = useWorkflowStore((state) => state.getChildStepsForLane);
  const childSteps = getChildStepsForLane(parallelStepId, laneIndex, "parallel");
  const childIds = childSteps.map((s) => s.id);

  const dropZoneId = `parallel-${parallelStepId}-lane-${laneIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    data: {
      type: "parallel-lane-drop",
      parallelStepId,
      laneIndex,
    },
  });

  return (
    <div className="flex flex-col items-center min-w-[100px]">
      {/* Connector from fork */}
      <div className="w-2 h-2 rounded-full bg-cyan-500 border-2 border-white shadow" />
      <div className="w-0.5 h-6 bg-cyan-400" />
      
      {/* Lane label */}
      <span className="text-[10px] font-medium text-cyan-500 mb-2">
        {lane.label}
      </span>

      {/* Drop zone / steps */}
      <div
        ref={setNodeRef}
        className={cn(
          "w-full min-h-[60px] rounded-lg transition-all",
          isOver
            ? "bg-cyan-500/10 border-2 border-dashed border-cyan-500"
            : "border border-dashed border-cyan-300 hover:border-cyan-400"
        )}
      >
        {childSteps.length === 0 ? (
          <div className="h-full flex items-center justify-center p-2">
            <span className="text-[10px] text-muted-foreground">
              {isOver ? "Drop here" : "Empty"}
            </span>
          </div>
        ) : (
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 p-2">
              {childSteps.map((child) => (
                <SortableStep key={child.id} id={child.id}>
                  <RailNode
                    step={child}
                    isSelected={false}
                    onClick={() => {}}
                  />
                </SortableStep>
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Connector to join */}
      <div className="w-0.5 h-6 bg-cyan-400" />
      <div className="w-2 h-2 rounded-full bg-cyan-500 border-2 border-white shadow" />
    </div>
  );
}

