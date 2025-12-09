import type { RuntimeInputConfig } from "@/app/api/workflows/types/workflow-settings";
import type { JSONSchema } from "@/app/api/workflows/types/schemas";

/**
 * Generates a JSON Schema from an array of runtime input configurations.
 * Converts workflow input definitions (RuntimeInputConfig[]) into a JSON Schema
 * that can be used for input validation and transpilation.
 * 
 * Used by the transpiler to generate the workflow's inputSchema from the
 * workflowInputs defined in the editor.
 * 
 * @param runtimeInputs - Array of runtime input configurations
 * @returns JSON Schema object with properties and required fields
 */
export function generateInputSchemaFromRuntimeInputs(
  runtimeInputs: RuntimeInputConfig[]
): JSONSchema {
  // If no inputs, return empty object schema (AC-9.8)
  if (!runtimeInputs || runtimeInputs.length === 0) {
    return {
      type: "object",
      properties: {},
      required: [],
    };
  }

  // Build properties object (AC-9.9)
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const input of runtimeInputs) {
    // Build property schema for this input
    const propertySchema: JSONSchema = {
      type: input.type === "array" ? "array" : 
            input.type === "object" ? "object" :
            input.type === "number" ? "number" :
            input.type === "boolean" ? "boolean" :
            "string", // default to string
    };

    // Add description if present
    if (input.description) {
      // JSON Schema uses "description" field (note: our JSONSchema type allows passthrough)
      (propertySchema as any).description = input.description;
    }

    // Add default value if present
    if (input.default !== undefined) {
      (propertySchema as any).default = input.default;
    }

    // Add to properties using key as property name
    properties[input.key] = propertySchema;

    // Add to required array if required (AC-9.10)
    if (input.required) {
      required.push(input.key);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

