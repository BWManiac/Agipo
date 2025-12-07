"use client";

import { ChevronLeft, ExternalLink } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import { FieldBindingRow } from "./FieldBindingRow";
import type { WorkflowStep } from "@/app/api/workflows/types";

interface InputBindingsSectionProps {
  stepId: string;
  stepIndex: number;
  inputSchema: Record<string, unknown>;
  previousSteps: WorkflowStep[];
  isFirstStep: boolean;
  onNavigateToStep: (stepId: string) => void;
}

export function InputBindingsSection({
  stepId,
  stepIndex,
  inputSchema,
  previousSteps,
  isFirstStep,
  onNavigateToStep,
}: InputBindingsSectionProps) {
  const { getBindingsForStep, workflowInputs } = useWorkflowStore();
  const bindings = getBindingsForStep(stepId);
  const previousStep = previousSteps[previousSteps.length - 1];

  // Parse input parameters from schema
  const inputFields = parseSchemaFields(inputSchema);

  return (
    <div className="border-b border-border">
      {/* Source banner */}
      {isFirstStep ? (
        <div className="mx-4 mt-4 mb-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 text-xs">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            Workflow Start — no previous step
          </span>
        </div>
      ) : previousStep ? (
        <button
          onClick={() => onNavigateToStep(previousStep.id)}
          className="mx-4 mt-4 mb-3 w-[calc(100%-2rem)] bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex items-center gap-2 text-xs hover:bg-blue-50 hover:border-blue-200 transition-colors group text-left"
        >
          <ChevronLeft className="h-4 w-4 text-blue-500" />
          <span className="text-blue-700">Receiving data from</span>
          <span className="text-blue-700 font-semibold underline decoration-blue-300 group-hover:decoration-blue-500">
            Step {stepIndex}: {previousStep.name}
          </span>
          <ExternalLink className="h-3 w-3 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ) : null}

      {/* Section header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Input Bindings
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {inputFields.length} fields
        </span>
      </div>

      {/* Fields */}
      <div className="px-4 pb-4 space-y-2">
        {inputFields.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No input parameters for this step
          </p>
        ) : (
          inputFields.map((field) => (
            <FieldBindingRow
              key={field.name}
              stepId={stepId}
              field={field}
              currentBinding={bindings?.inputBindings[field.name]}
              previousSteps={previousSteps}
              workflowInputs={workflowInputs}
              isFirstStep={isFirstStep}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

function parseSchemaFields(schema: Record<string, unknown>): SchemaField[] {
  const properties = (schema as { properties?: Record<string, unknown> })?.properties;
  const required = (schema as { required?: string[] })?.required || [];

  if (!properties) return [];

  return Object.entries(properties).map(([name, prop]) => {
    const propObj = prop as { type?: string; description?: string };
    return {
      name,
      type: propObj?.type || "unknown",
      description: propObj?.description,
      required: required.includes(name),
    };
  });
}

