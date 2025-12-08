import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import type { StepBindings } from "@/app/api/workflows/types/bindings";
import type { TranspilerContext } from "./types";
import { generateZodCodeString } from "./schema-generator";
import { generateMappingCode } from "./mapping-generator";

/**
 * Generates the workflow composition chain.
 * Creates the createWorkflow() call with .then() chains and .commit().
 */
export function generateWorkflowComposition(
  definition: WorkflowDefinition,
  bindings: Record<string, StepBindings>,
  context: TranspilerContext
): string {
  const inputZod = generateZodCodeString(definition.inputSchema);
  const workflowVar = generateWorkflowVarName(definition.name);

  // Start workflow declaration
  let code = `export const ${workflowVar} = createWorkflow({
  id: "${definition.id}",
  inputSchema: ${inputZod},
  outputSchema: z.any()
})`;

  // Sort steps by listIndex for sequential ordering
  const sortedSteps = [...definition.steps].sort(
    (a, b) => a.listIndex - b.listIndex
  );

  // Add .then() for each step, with .map() before if bindings exist
  for (const step of sortedSteps) {
    // Skip control flow steps for now (Phase 10)
    if (step.type === "control") {
      continue;
    }

    const stepVar = context.stepVarMap.get(step.id);
    if (!stepVar) continue;

    // Add mapping if step has bindings
    const mappingCode = generateMappingCode(step.id, bindings, context);
    if (mappingCode) {
      code += `\n${mappingCode}`;
    }

    code += `\n  .then(${stepVar})`;
  }

  code += "\n  .commit();";

  return code;
}

/**
 * Converts workflow name to valid JS variable name.
 */
function generateWorkflowVarName(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");

  return cleaned ? `${cleaned}Workflow` : "workflow";
}

