"use client";

import { ArrowRight } from "lucide-react";
import type { WorkflowStep, JSONSchema } from "@/app/api/workflows-d/services/types";

interface StepCardExpandedProps {
  step: WorkflowStep;
}

export function StepCardExpanded({ step }: StepCardExpandedProps) {
  return (
    <div className="px-4 pb-4 pt-2 border-t border-white/5 mt-2">
      <div className="grid grid-cols-2 gap-4">
        {/* Input Schema */}
        <div>
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Inputs
          </h5>
          <SchemaPreview schema={step.inputSchema} />
        </div>

        {/* Output Schema */}
        <div>
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Outputs
          </h5>
          <SchemaPreview schema={step.outputSchema} />
        </div>
      </div>

      {/* Description */}
      {step.description && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-slate-400">{step.description}</p>
        </div>
      )}

      {/* Custom code preview */}
      {step.type === "custom" && step.code && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <h5 className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Code Preview
          </h5>
          <pre className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-3 overflow-x-auto font-mono">
            {step.code.slice(0, 200)}
            {step.code.length > 200 && "..."}
          </pre>
        </div>
      )}
    </div>
  );
}

interface SchemaPreviewProps {
  schema: JSONSchema;
}

function SchemaPreview({ schema }: SchemaPreviewProps) {
  const properties = schema.properties || {};
  const required = schema.required || [];
  const keys = Object.keys(properties);

  if (keys.length === 0) {
    return (
      <p className="text-xs text-slate-500 italic">No fields defined</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {keys.slice(0, 5).map((key) => {
        const prop = properties[key] as JSONSchema & { description?: string };
        const isRequired = required.includes(key);

        return (
          <div 
            key={key}
            className="flex items-center gap-2 text-xs"
          >
            <span className="font-mono text-violet-300">{key}</span>
            {isRequired && (
              <span className="text-red-400">*</span>
            )}
            <span className="text-slate-500">:</span>
            <TypeBadge type={prop.type} />
          </div>
        );
      })}
      {keys.length > 5 && (
        <p className="text-xs text-slate-500">
          +{keys.length - 5} more fields
        </p>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    string: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    number: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    integer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    boolean: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    object: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    array: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[type] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
      {type}
    </span>
  );
}




