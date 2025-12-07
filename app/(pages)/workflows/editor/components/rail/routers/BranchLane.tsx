"use client";

import type { BranchCondition } from "@/app/api/workflows/types/execution-flow";
import { useWorkflowStore } from "../../../store";
import { RailNode } from "../RailNode";
import { SortableStep } from "../../drag-and-drop/SortableStep";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface BranchLaneProps {
  branchStepId: string;
  conditionIndex: number;
  condition: BranchCondition | { id: string; label: string };
  color: { dot: string; line: string; label: string };
}

/**
 * Individual branch lane.
 * Shows lane label and provides drop zone for steps.
 */
export function BranchLane({
  branchStepId,
  conditionIndex,
  condition,
  color,
}: BranchLaneProps) {
  const getChildStepsForLane = useWorkflowStore((state) => state.getChildStepsForLane);
  const childSteps = getChildStepsForLane(branchStepId, conditionIndex, "branch");
  const childIds = childSteps.map((s) => s.id);

  const dropZoneId = `branch-${branchStepId}-lane-${conditionIndex}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    data: {
      type: "branch-lane-drop",
      branchStepId,
      conditionIndex,
    },
  });

  return (
    <div className="flex flex-col items-center min-w-[100px]">
      {/* Connector from router */}
      <div className={cn("w-2 h-2 rounded-full border-2 border-white shadow", color.dot)} />
      <div className={cn("w-0.5 h-6", color.line)} />
      
      {/* Lane label */}
      <span className={cn("text-[10px] font-medium mb-2", color.label)}>
        {condition.label}
      </span>

      {/* Drop zone / steps */}
      <div
        ref={setNodeRef}
        className={cn(
          "w-full min-h-[60px] rounded-lg transition-all",
          isOver
            ? "bg-primary/10 border-2 border-dashed border-primary"
            : "border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
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

      {/* Connector to merge */}
      <div className={cn("w-0.5 h-6", color.line)} />
      <div className={cn("w-2 h-2 rounded-full border-2 border-white shadow", color.dot)} />
    </div>
  );
}

