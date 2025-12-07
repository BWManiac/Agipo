"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JSONSchema } from "@/app/api/workflows/services/types";

interface SchemaFieldProps {
  name: string;
  schema: JSONSchema & { description?: string };
  isRequired: boolean;
  depth?: number;
}

export function SchemaField({ name, schema, isRequired, depth = 0 }: SchemaFieldProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const hasNestedProperties = schema.type === "object" && schema.properties && Object.keys(schema.properties).length > 0;
  const hasArrayItems = schema.type === "array" && schema.items;

  const typeColor = getTypeColor(schema.type);

  return (
    <div>
      <div
        className={cn(
          "flex items-start gap-2 px-3 py-2",
          hasNestedProperties || hasArrayItems ? "cursor-pointer hover:bg-slate-100" : ""
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => (hasNestedProperties || hasArrayItems) && setIsExpanded(!isExpanded)}
      >
        {(hasNestedProperties || hasArrayItems) && (
          <span className="mt-0.5">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            )}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{name}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", typeColor)}>{schema.type}</span>
            {isRequired && <span className="text-[10px] text-red-500 font-medium">required</span>}
          </div>
          {schema.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{schema.description}</p>}
          {schema.enum && (
            <p className="text-xs text-slate-400 mt-0.5">
              Options: {schema.enum.map(String).join(", ")}
            </p>
          )}
        </div>
      </div>
      {isExpanded && hasNestedProperties && schema.properties && (
        <div className="border-l ml-4">
          {Object.entries(schema.properties).map(([key, nestedSchema]) => (
            <SchemaField
              key={key}
              name={key}
              schema={nestedSchema as JSONSchema & { description?: string }}
              isRequired={schema.required?.includes(key) ?? false}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      {isExpanded && hasArrayItems && schema.items && (
        <div className="border-l ml-4">
          <SchemaField
            name="[item]"
            schema={schema.items as JSONSchema & { description?: string }}
            isRequired={false}
            depth={depth + 1}
          />
        </div>
      )}
    </div>
  );
}

function getTypeColor(type: string): string {
  switch (type) {
    case "string": return "bg-green-100 text-green-700";
    case "number":
    case "integer": return "bg-blue-100 text-blue-700";
    case "boolean": return "bg-purple-100 text-purple-700";
    case "array": return "bg-amber-100 text-amber-700";
    case "object": return "bg-slate-200 text-slate-700";
    default: return "bg-slate-100 text-slate-600";
  }
}




