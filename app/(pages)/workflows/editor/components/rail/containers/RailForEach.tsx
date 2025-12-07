"use client";

import { List } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { ForEachConfig } from "@/app/api/workflows/types/execution-flow";
import { useWorkflowStore } from "../../../store";
import { RailNode } from "../RailNode";
import { ContainerDropZone } from "./ContainerDropZone";
import { SortableStep } from "../../drag-and-drop/SortableStep";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface RailForEachProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * ForEach container component.
 * Renders a dashed pink border container for iterating over arrays.
 */
export function RailForEach({ step, isSelected, onClick }: RailForEachProps) {
  const getChildSteps = useWorkflowStore((state) => state.getChildSteps);
  const childSteps = getChildSteps(step.id);
  const childIds = childSteps.map((s) => s.id);
  const config = step.controlConfig as ForEachConfig | undefined;

  const arraySource = config?.arraySource || "items";
  const concurrency = config?.concurrency || 1;
  const itemVar = config?.itemVariable || "item";

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
          ? "border-pink-500 bg-pink-500/5 ring-2 ring-pink-500/20"
          : "border-pink-400/60 bg-pink-500/5 hover:border-pink-500"
      )}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-pink-400/30 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-pink-100 flex items-center justify-center">
          <List className="h-4 w-4 text-pink-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-pink-600">FOR EACH</div>
          <code className="text-xs text-pink-500 truncate block">
            {itemVar} in {arraySource}[]
            {concurrency > 1 && ` (×${concurrency})`}
          </code>
        </div>
      </div>

      {/* Child steps area */}
      <div className="p-3 min-h-[80px]">
        {childSteps.length === 0 ? (
          <ContainerDropZone
            id={`foreach-${step.id}-drop-0`}
            containerId={step.id}
            index={0}
            className="min-h-[60px] border border-dashed border-pink-300 rounded-lg"
          />
        ) : (
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              <ContainerDropZone
                id={`foreach-${step.id}-drop-0`}
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
                    id={`foreach-${step.id}-drop-${index + 1}`}
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
      <div className="px-4 py-1.5 border-t border-pink-400/30 flex items-center justify-between">
        <span className="text-[10px] text-pink-500">
          output: results[]
        </span>
        {concurrency > 1 && (
          <span className="text-[10px] text-pink-400">
            {concurrency} concurrent
          </span>
        )}
      </div>
    </div>
  );
}

