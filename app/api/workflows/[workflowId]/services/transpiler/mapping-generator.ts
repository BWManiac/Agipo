import type { StepBindings, FieldBinding } from "@/app/api/workflows/types/bindings";
import type { TranspilerContext } from "./types";

/**
 * Generates .map() code for a step's input bindings.
 * Returns empty string if step has no bindings.
 */
export function generateMappingCode(
  stepId: string,
  bindings: Record<string, StepBindings>,
  context: TranspilerContext
): string {
  const stepBindings = bindings[stepId];
  if (!stepBindings || Object.keys(stepBindings.inputBindings).length === 0) {
    return "";
  }

  const fieldMappings = Object.entries(stepBindings.inputBindings)
    .map(([fieldName, binding]) => {
      const sourceExpr = generateSourceExpression(binding);
      return `      ${safePropertyName(fieldName)}: ${sourceExpr}`;
    })
    .join(",\n");

  return `  .map(async ({ inputData, getStepResult, getInitData }) => {
    return {
${fieldMappings}
    };
  })`;
}

/**
 * Generates the source expression for a field binding.
 */
function generateSourceExpression(binding: FieldBinding): string {
  switch (binding.sourceType) {
    case "step-output":
      if (binding.sourceStepId && binding.sourcePath) {
        // IMPORTANT: Strip "data." prefix if present.
        // Composio tools return { successful, data: {...}, error } but our step execute()
        // returns result.data (unwrapped). So getStepResult() returns the unwrapped data.
        // Old bindings may have "data.field" paths; we need to strip the "data." prefix.
        const normalizedPath = binding.sourcePath.startsWith("data.")
          ? binding.sourcePath.slice(5)  // Remove "data." prefix
          : binding.sourcePath;
        return `getStepResult("${binding.sourceStepId}")?.${normalizedPath}`;
      }
      return "undefined";

    case "workflow-input":
      if (binding.workflowInputName) {
        // Use getInitData() to access original workflow input, not inputData
        // inputData in a .map() is the previous step's output, not workflow input
        return `getInitData()["${binding.workflowInputName}"]`;
      }
      return "undefined";

    case "literal":
      return JSON.stringify(binding.literalValue);

    default:
      return "undefined";
  }
}

/**
 * Ensures property name is valid JS identifier or quotes it.
 */
function safePropertyName(name: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return `"${name}"`;
}

