"use client";

import { useState } from "react";
import { Plus, GitBranch } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { WorkflowStep } from "@/app/api/workflows/services/types";
import { StepCard } from "./StepCard";
import { DataFlowIndicator } from "./DataFlowIndicator";
import { WorkflowOverview } from "./WorkflowOverview";
import { DataMappingModal } from "./DataMappingModal";

export function ListView() {
  const { steps, mappings, runtimeInputs, connections, setActiveTab } = useWorkflowEditorStore();
  const [mappingTarget, setMappingTarget] = useState<{
    source: WorkflowStep | null;
    target: WorkflowStep;
  } | null>(null);

  const sortedSteps = [...steps].sort((a, b) => a.listIndex - b.listIndex);

  // Get mapped fields for data flow indicator between steps
  function getMappedFields(sourceStepId: string, targetStepId: string): string[] {
    const mapping = mappings.find(
      (m) => m.sourceStepId === sourceStepId && m.targetStepId === targetStepId
    );
    return mapping?.fieldMappings.map((f) => f.targetField) || [];
  }

  function openMappingModal(source: WorkflowStep | null, target: WorkflowStep) {
    setMappingTarget({ source, target });
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-900/95">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Workflow Overview Card */}
        <WorkflowOverview />

        {/* Timeline */}
        <div className="relative mt-8">
          {/* Timeline connector line */}
          {sortedSteps.length > 0 && (
            <div className="absolute left-8 top-10 bottom-24 w-0.5 bg-slate-700" />
          )}

          {/* Steps */}
          {sortedSteps.map((step, index) => {
            const prevStep = sortedSteps[index - 1] || null;
            const sourceId = prevStep?.id || "__input__";
            const mappedFields = getMappedFields(sourceId, step.id);

            return (
              <div key={step.id}>
                {/* Data Flow Indicator */}
                <DataFlowIndicator
                  fields={mappedFields}
                  onClick={() => openMappingModal(prevStep, step)}
                  isFirst={index === 0}
                />

                {/* Step Card */}
                <StepCard step={step} index={index} />
              </div>
            );
          })}

          {/* Add Step Button */}
          <div className="relative flex gap-4 mt-4">
            <div className="w-16 flex-shrink-0 flex flex-col items-center">
              <button
                onClick={() => setActiveTab("palette")}
                className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-600 z-10 hover:border-cyan-500 hover:text-cyan-400 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <p className="text-sm text-slate-500">Click to add a step</p>
            </div>
          </div>
        </div>

        {/* Data Mapping Modal */}
        {mappingTarget && (
          <DataMappingModal
            sourceStep={mappingTarget.source}
            targetStep={mappingTarget.target}
            onClose={() => setMappingTarget(null)}
          />
        )}

        {/* Empty State */}
        {sortedSteps.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800 mb-4">
              <GitBranch className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">No steps yet</h3>
            <p className="text-slate-500 mb-4">Add tools from the palette to build your workflow</p>
            <button
              onClick={() => setActiveTab("palette")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add First Step
            </button>
          </div>
        )}
      </div>
    </div>
  );
}




