"use client";

import { useWorkflowStore } from "../../../store";
import { SourceSelector } from "./SourceSelector";
import type { FieldBinding, WorkflowInputDefinition } from "@/app/api/workflows/types/bindings";
import type { WorkflowStep } from "@/app/api/workflows/types";

interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

interface FieldBindingRowProps {
  stepId: string;
  field: SchemaField;
  currentBinding?: FieldBinding;
  previousSteps: WorkflowStep[];
  workflowInputs: WorkflowInputDefinition[];
  isFirstStep: boolean;
}

export function FieldBindingRow({
  stepId,
  field,
  currentBinding,
  previousSteps,
  workflowInputs,
  isFirstStep,
}: FieldBindingRowProps) {
  const { setFieldBinding, steps } = useWorkflowStore();
  const isMapped = !!currentBinding;

  const handleBindingChange = (binding: FieldBinding) => {
    setFieldBinding(stepId, field.name, binding);
  };

  // Get display text for current binding
  const getBindingDisplay = () => {
    if (!currentBinding) return null;

    switch (currentBinding.sourceType) {
      case "step-output": {
        const sourceStep = steps.find((s) => s.id === currentBinding.sourceStepId);
        const sourceIndex = steps.findIndex((s) => s.id === currentBinding.sourceStepId);
        return `Step ${sourceIndex + 1} → ${currentBinding.sourcePath}`;
      }
      case "workflow-input":
        return `Workflow Input: ${currentBinding.workflowInputName}`;
      case "literal":
        return `"${String(currentBinding.literalValue)}"`;
      default:
        return null;
    }
  };

  return (
    <div
      className={`rounded-lg p-3 border ${
        isMapped
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-100"
      }`}
    >
      {/* Field header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-medium ${
                isMapped ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {field.name}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                field.required
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {field.required ? "required" : "optional"}
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
              {field.type}
            </span>
          </div>
          {field.description && (
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">
              {field.description}
            </p>
          )}
        </div>
      </div>

      {/* Binding display or selector */}
      {isMapped ? (
        <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 px-2.5 py-1.5">
          <span className="text-xs text-gray-700 flex-1 truncate">
            {getBindingDisplay()}
          </span>
          <SourceSelector
            stepId={stepId}
            fieldName={field.name}
            currentBinding={currentBinding}
            previousSteps={previousSteps}
            workflowInputs={workflowInputs}
            isFirstStep={isFirstStep}
            onChange={handleBindingChange}
            variant="edit"
          />
        </div>
      ) : (
        <SourceSelector
          stepId={stepId}
          fieldName={field.name}
          currentBinding={currentBinding}
          previousSteps={previousSteps}
          workflowInputs={workflowInputs}
          isFirstStep={isFirstStep}
          onChange={handleBindingChange}
          variant="empty"
        />
      )}
    </div>
  );
}

