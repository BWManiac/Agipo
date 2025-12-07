"use client";

import { Repeat } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { LoopConfig } from "@/app/api/workflows/types/execution-flow";
import { useWorkflowStore } from "../../../store";
import { RailNode } from "../RailNode";
import { ContainerDropZone } from "./ContainerDropZone";
import { SortableStep } from "../../drag-and-drop/SortableStep";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface RailLoopProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Loop container component.
 * Renders a dashed violet border container that holds child steps.
 * Supports DO UNTIL and DO WHILE patterns.
 */
export function RailLoop({ step, isSelected, onClick }: RailLoopProps) {
  const getChildSteps = useWorkflowStore((state) => state.getChildSteps);
  const childSteps = getChildSteps(step.id);
  const childIds = childSteps.map((s) => s.id);
  const config = step.controlConfig as LoopConfig | undefined;

  const loopType = config?.type === "while" ? "DO WHILE" : "DO UNTIL";
  const condition = config?.condition || "condition";
  const maxIterations = config?.maxIterations || 100;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "relative min-w-[280px] max-w-[400px] rounded-xl transition-all",
        "border-2 border-dashed",
        isSelected
          ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500/20"
          : "border-violet-400/60 bg-violet-500/5 hover:border-violet-500"
      )}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-violet-400/30 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-violet-100 flex items-center justify-center">
          <Repeat className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-violet-600">{loopType}</div>
          <code className="text-xs text-violet-500 truncate block">{condition}</code>
        </div>
      </div>

      {/* Child steps area */}
      <div className="p-3 min-h-[80px]">
        {childSteps.length === 0 ? (
          <ContainerDropZone
            id={`loop-${step.id}-drop-0`}
            containerId={step.id}
            index={0}
            className="min-h-[60px] border border-dashed border-violet-300 rounded-lg"
          />
        ) : (
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              <ContainerDropZone
                id={`loop-${step.id}-drop-0`}
                containerId={step.id}
                index={0}
              />
              {childSteps.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center">
                  <SortableStep id={child.id}>
                    <RailNode
                      step={child}
                      isSelected={false}
                      onClick={() => {}}
                    />
                  </SortableStep>
                  <ContainerDropZone
                    id={`loop-${step.id}-drop-${index + 1}`}
                    containerId={step.id}
                    index={index + 1}
                  />
                </div>
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-violet-400/30 flex items-center justify-between">
        <span className="text-[10px] text-violet-500">
          max: {maxIterations} iterations
        </span>
        {/* Loop-back arrow indicator */}
        <div className="flex items-center gap-1 text-violet-400">
          <Repeat className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

