"use client";

import { ArrowRightLeft } from "lucide-react";
import type { WorkflowStep, JSONSchema } from "@/app/api/workflows/services/types";
import { SchemaField } from "./SchemaField";

interface OutputSchemaSectionProps {
  step: WorkflowStep;
}

export function OutputSchemaSection({ step }: OutputSchemaSectionProps) {
  const properties = step.outputSchema.properties ? Object.entries(step.outputSchema.properties) : [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-green-100">
          <ArrowRightLeft className="h-4 w-4 text-green-600" />
        </div>
        <span className="font-medium">Outputs</span>
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
                isRequired={false}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-400 text-center">
            No outputs defined (terminal step)
          </div>
        )}
      </div>
    </div>
  );
}




