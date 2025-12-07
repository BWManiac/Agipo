import type { JSONSchema } from "@/app/api/workflows-d/services/types";

export interface SchemaField {
  path: string;
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

/**
 * Extract all fields from a JSON Schema, including nested properties
 */
export function extractSchemaFields(
  schema: JSONSchema,
  prefix: string = "",
  required: string[] = []
): SchemaField[] {
  const fields: SchemaField[] = [];

  if (schema.type === "object" && schema.properties) {
    const schemaRequired = schema.required || [];
    
    for (const [key, prop] of Object.entries(schema.properties)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const propSchema = prop as JSONSchema & { description?: string };
      
      fields.push({
        path,
        name: key,
        type: propSchema.type,
        description: propSchema.description,
        required: schemaRequired.includes(key) || required.includes(key),
      });

      // Recursively extract nested object fields
      if (propSchema.type === "object" && propSchema.properties) {
        fields.push(
          ...extractSchemaFields(propSchema, path, propSchema.required || [])
        );
      }

      // Handle array items
      if (propSchema.type === "array" && propSchema.items) {
        const itemSchema = propSchema.items as JSONSchema;
        if (itemSchema.type === "object" && itemSchema.properties) {
          fields.push(
            ...extractSchemaFields(itemSchema, `${path}[]`, itemSchema.required || [])
          );
        }
      }
    }
  }

  return fields;
}

/**
 * Check if two types are compatible for mapping
 */
export function checkTypeCompatibility(
  sourceType: string,
  targetType: string
): "exact" | "coercible" | "incompatible" {
  // Exact match
  if (sourceType === targetType) {
    return "exact";
  }

  // Coercible mappings
  const coerciblePairs: [string, string][] = [
    ["integer", "number"],
    ["number", "integer"],
    ["string", "number"],
    ["number", "string"],
    ["boolean", "string"],
    ["string", "boolean"],
  ];

  for (const [from, to] of coerciblePairs) {
    if (sourceType === from && targetType === to) {
      return "coercible";
    }
  }

  // Any type can be mapped to string (via JSON.stringify if needed)
  if (targetType === "string") {
    return "coercible";
  }

  return "incompatible";
}

/**
 * Get a human-readable type label
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    string: "String",
    number: "Number",
    integer: "Integer",
    boolean: "Boolean",
    object: "Object",
    array: "Array",
  };
  return labels[type] || type;
}

/**
 * Get color classes for a type badge
 */
export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    string: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    number: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    integer: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    boolean: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    object: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    array: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };
  return colors[type] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
}




