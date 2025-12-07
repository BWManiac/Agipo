"use client";

import { ArrowRightLeft } from "lucide-react";
import type { WorkflowStep, JSONSchema } from "@/app/api/workflows/services/types";
import { SchemaField } from "./SchemaField";

interface InputSchemaSectionProps {
  step: WorkflowStep;
}

export function InputSchemaSection({ step }: InputSchemaSectionProps) {
  const properties = step.inputSchema.properties ? Object.entries(step.inputSchema.properties) : [];
  const required = step.inputSchema.required || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-blue-100">
          <ArrowRightLeft className="h-4 w-4 text-blue-600 rotate-180" />
        </div>
        <span className="font-medium">Inputs</span>
        <span className="text-xs text-slate-400">({properties.length} fields)</span>
      </div>
      <div className="bg-slate-50 rounded-lg border">
        {properties.length > 0 ? (
          <div className="divide-y">
            {properties.map(([key, schema]) => (
              <SchemaField
                key={key}
                name={key}
                schema={schema as JSONSchema & { description?: string }}
                isRequired={required.includes(key)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-400 text-center">No inputs defined</div>
        )}
      </div>
    </div>
  );
}




