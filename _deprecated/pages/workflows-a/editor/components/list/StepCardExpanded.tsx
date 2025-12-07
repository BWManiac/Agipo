"use client";

import type { WorkflowStep } from "@/app/api/workflows/services/types";
import { ArrowRightLeft, Code } from "lucide-react";

interface StepCardExpandedProps {
  step: WorkflowStep;
}

export function StepCardExpanded({ step }: StepCardExpandedProps) {
  const inputProperties = step.inputSchema.properties 
    ? Object.entries(step.inputSchema.properties) 
    : [];
  const outputProperties = step.outputSchema.properties 
    ? Object.entries(step.outputSchema.properties) 
    : [];
  const requiredInputs = step.inputSchema.required || [];

  return (
    <div className="border-t px-4 pb-4 pt-3 space-y-4">
      {/* Description */}
      {step.description && (
        <p className="text-sm text-slate-600">{step.description}</p>
      )}

      {/* Input Schema */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowRightLeft className="h-4 w-4 text-slate-400 rotate-180" />
          <span className="text-sm font-medium text-slate-700">Inputs</span>
          <span className="text-xs text-slate-400">
            ({inputProperties.length} fields)
          </span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          {inputProperties.length > 0 ? (
            <div className="space-y-1.5">
              {inputProperties.map(([key, schema]) => (
                <SchemaField
                  key={key}
                  name={key}
                  schema={schema}
                  isRequired={requiredInputs.includes(key)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No inputs defined</p>
          )}
        </div>
      </div>

      {/* Output Schema */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ArrowRightLeft className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Outputs</span>
          <span className="text-xs text-slate-400">
            ({outputProperties.length} fields)
          </span>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          {outputProperties.length > 0 ? (
            <div className="space-y-1.5">
              {outputProperties.map(([key, schema]) => (
                <SchemaField
                  key={key}
                  name={key}
                  schema={schema}
                  isRequired={false}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No outputs defined (terminal step)</p>
          )}
        </div>
      </div>

      {/* Custom code preview (for custom steps) */}
      {step.type === "custom" && step.code && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Code</span>
          </div>
          <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-slate-300 font-mono">
              {step.code.slice(0, 200)}
              {step.code.length > 200 && "..."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface SchemaFieldProps {
  name: string;
  schema: { type?: string; description?: string };
  isRequired: boolean;
}

function SchemaField({ name, schema, isRequired }: SchemaFieldProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium text-slate-700">{name}</span>
      <span className="text-slate-400">:</span>
      <span className="text-slate-500">{schema.type || "unknown"}</span>
      {isRequired && (
        <span className="text-red-500 text-[10px]">required</span>
      )}
      {schema.description && (
        <span className="text-slate-400 truncate max-w-[200px]" title={schema.description}>
          — {schema.description}
        </span>
      )}
    </div>
  );
}




