import type { WorkflowStep } from "@/app/api/workflows/types/workflow-step";
import type { TranspilerContext } from "./types";
import { generateZodCodeString } from "./schema-generator";

/**
 * Generates createStep() code for a workflow step.
 * Returns the step variable name and its declaration code.
 */
export function generateStepCode(
  step: WorkflowStep,
  context: TranspilerContext
): { varName: string; code: string } {
  const varName = generateVarName(step.name);
  context.stepVarMap.set(step.id, varName);

  const inputZod = generateZodCodeString(step.inputSchema);
  const outputZod = generateZodCodeString(step.outputSchema);

  let executeBody: string;

  if (step.type === "composio" && step.toolId && step.toolkitSlug) {
    // Composio tool execution
    context.usedImports.add("composio");
    executeBody = generateComposioExecuteBody(step.toolId, step.toolkitSlug);
  } else {
    // Placeholder for non-Composio steps
    executeBody = `return inputData;`;
  }

  const code = `const ${varName} = createStep({
  id: "${step.id}",
  inputSchema: ${inputZod},
  outputSchema: ${outputZod},
  execute: async ({ inputData, runtimeContext }) => {
    ${executeBody}
  }
});`;

  return { varName, code };
}

/**
 * Generates execute body for Composio tool steps.
 */
function generateComposioExecuteBody(toolId: string, toolkitSlug: string): string {
  return `const connections = runtimeContext.get("connections") as Record<string, string> | undefined;
    const connectionId = connections?.["${toolkitSlug}"];
    const result = await composio.executeAction(
      "${toolId}",
      inputData,
      { connectedAccountId: connectionId }
    );
    if (!result.successful) {
      throw new Error(result.error || "Tool execution failed");
    }
    return result.data;`;
}

/**
 * Converts step name to valid JS variable name.
 */
function generateVarName(name: string): string {
  // Remove non-alphanumeric, convert to camelCase
  const cleaned = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");

  // Ensure it starts with a letter
  if (/^[0-9]/.test(cleaned)) {
    return `step${cleaned}`;
  }

  return cleaned || "step";
}

