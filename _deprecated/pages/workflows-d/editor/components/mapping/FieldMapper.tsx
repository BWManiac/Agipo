"use client";

import { ArrowRight, X, CheckCircle, AlertCircle } from "lucide-react";
import type { FieldMapping } from "@/app/api/workflows-d/services/types";
import type { SchemaField } from "../../utils/schemaUtils";
import { getTypeColor } from "../../utils/schemaUtils";

interface FieldMapperProps {
  mapping: FieldMapping;
  sourceFields: SchemaField[];
  targetFields: SchemaField[];
  onUpdate: (updates: Partial<FieldMapping>) => void;
  onRemove: () => void;
}

export function FieldMapper({
  mapping,
  sourceFields,
  targetFields,
  onUpdate,
  onRemove,
}: FieldMapperProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/30 border border-white/5 rounded-xl">
      {/* Source field */}
      <div className="flex-1 min-w-0">
        <select
          value={mapping.sourcePath}
          onChange={(e) => onUpdate({ sourcePath: e.target.value })}
          className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {sourceFields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path}
            </option>
          ))}
        </select>
        {mapping.sourceType && (
          <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded border ${getTypeColor(mapping.sourceType)}`}>
            {mapping.sourceType}
          </span>
        )}
      </div>

      {/* Arrow with type compatibility indicator */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <ArrowRight className="h-4 w-4 text-slate-500" />
        <TypeMatchIndicator typeMatch={mapping.typeMatch} />
      </div>

      {/* Target field */}
      <div className="flex-1 min-w-0">
        <select
          value={mapping.targetField}
          onChange={(e) => onUpdate({ targetField: e.target.value })}
          className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {targetFields.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path}
            </option>
          ))}
        </select>
        {mapping.targetType && (
          <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded border ${getTypeColor(mapping.targetType)}`}>
            {mapping.targetType}
          </span>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Remove mapping"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TypeMatchIndicator({ typeMatch }: { typeMatch?: "exact" | "coercible" | "incompatible" }) {
  if (!typeMatch) return null;

  switch (typeMatch) {
    case "exact":
      return (
        <span className="text-[10px] text-emerald-400" title="Types match exactly">
          <CheckCircle className="h-3 w-3" />
        </span>
      );
    case "coercible":
      return (
        <span className="text-[10px] text-amber-400" title="Types are compatible (may need conversion)">
          <AlertCircle className="h-3 w-3" />
        </span>
      );
    case "incompatible":
      return (
        <span className="text-[10px] text-red-400" title="Types are incompatible">
          <AlertCircle className="h-3 w-3" />
        </span>
      );
    default:
      return null;
  }
}




