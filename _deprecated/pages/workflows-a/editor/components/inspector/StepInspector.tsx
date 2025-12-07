"use client";

import { useWorkflowEditorStore } from "../../store";
import { StepHeader } from "./StepHeader";
import { DataMappingSection } from "./DataMappingSection";
import { InputSchemaSection } from "./InputSchemaSection";
import { OutputSchemaSection } from "./OutputSchemaSection";
import { NoSelectionState } from "./NoSelectionState";

export function StepInspector() {
  const { selectedStepId, steps } = useWorkflowEditorStore();
  const selectedStep = selectedStepId ? steps.find((s) => s.id === selectedStepId) : null;

  if (!selectedStep) {
    return <NoSelectionState />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <StepHeader step={selectedStep} />
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <DataMappingSection step={selectedStep} />
        <InputSchemaSection step={selectedStep} />
        <OutputSchemaSection step={selectedStep} />
      </div>
    </div>
  );
}

