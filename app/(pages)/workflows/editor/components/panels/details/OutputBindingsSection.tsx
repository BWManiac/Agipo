"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import type { WorkflowStep } from "@/app/api/workflows/types";

interface OutputBindingsSectionProps {
  stepId: string;
  stepIndex: number;
  outputSchema: Record<string, unknown>;
  nextStep?: WorkflowStep;
  isLastStep: boolean;
  onNavigateToStep: (stepId: string) => void;
}

export function OutputBindingsSection({
  stepId,
  stepIndex,
  outputSchema,
  nextStep,
  isLastStep,
  onNavigateToStep,
}: OutputBindingsSectionProps) {
  const { getOutputUsage, steps } = useWorkflowStore();
  const usage = getOutputUsage(stepId);
  const nextStepIndex = stepIndex + 1;

  return (
    <div className="border-b border-border">
      {/* Destination banner */}
      {isLastStep ? (
        <div className="mx-4 mt-4 mb-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Workflow End — outputs not connected
          </span>
        </div>
      ) : nextStep ? (
        <button
          onClick={() => onNavigateToStep(nextStep.id)}
          className="mx-4 mt-4 mb-3 w-[calc(100%-2rem)] bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex items-center gap-2 text-xs hover:bg-emerald-50 hover:border-emerald-200 transition-colors group text-left"
        >
          <ChevronRight className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-700">Sending data to</span>
          <span className="text-emerald-700 font-semibold underline decoration-emerald-300 group-hover:decoration-emerald-500">
            Step {nextStepIndex + 1}: {nextStep.name}
          </span>
          <ExternalLink className="h-3 w-3 text-emerald-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ) : null}

      {/* Section header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Output Bindings
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {usage.length} connected
        </span>
      </div>

      {/* Usage list */}
      <div className="px-4 pb-4 space-y-2">
        {usage.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No outputs mapped yet
          </p>
        ) : (
          usage.map((item, idx) => {
            const targetStepIndex = steps.findIndex((s) => s.id === item.usedByStepId);
            return (
              <button
                key={`${item.outputPath}-${item.usedByField}-${idx}`}
                onClick={() => onNavigateToStep(item.usedByStepId)}
                className="w-full flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 px-2.5 py-2 text-xs transition-colors group"
              >
                <span className="text-gray-600 font-mono">{item.outputPath}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-700">
                  Step {targetStepIndex + 1}: {item.usedByField}
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

