"use client";

import { useWorkflowStore } from "../store";
import { RailNode } from "./rail/RailNode";
import { RailConnector } from "./rail/RailConnector";
import { DropZone } from "./drag-and-drop/DropZone";
import { SortableStep } from "./drag-and-drop/SortableStep";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

export function RailView() {
  const { steps, selectedStepId, setSelectedStepId } = useWorkflowStore();

  // Only show top-level steps (no parent) - children render inside their containers
  const topLevelSteps = steps.filter((s) => !s.parentId);
  const stepIds = topLevelSteps.map((s) => s.id);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex flex-col items-center">
        {/* Start indicator */}
        <div className="text-xs text-muted-foreground mb-1">START</div>
        <div className="w-0.5 h-4 bg-border" />

        {/* First drop zone (for empty state or inserting at start) */}
        <DropZone id="drop-zone-0" index={0} />

        {topLevelSteps.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-muted-foreground mb-2">No steps yet</div>
            <div className="text-sm text-muted-foreground/70">
              Drag tools here to build your workflow
            </div>
          </div>
        ) : (
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            {topLevelSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                {index > 0 && <RailConnector />}
                <SortableStep id={step.id}>
                  <RailNode
                    step={step}
                    isSelected={selectedStepId === step.id}
                    onClick={() => setSelectedStepId(step.id)}
                  />
                </SortableStep>
                <DropZone id={`drop-zone-${index + 1}`} index={index + 1} />
              </div>
            ))}
          </SortableContext>
        )}

        {/* End indicator */}
        <div className="w-0.5 h-4 bg-border" />
        <div className="text-xs text-muted-foreground mt-1">END</div>
      </div>
    </div>
  );
}

