/**
 * Workflow Registry
 *
 * Static imports of all transpiled workflows. This file is auto-updated
 * when workflows are transpiled, enabling Turbopack-compatible workflow loading.
 *
 * Why this exists:
 * - Turbopack cannot handle dynamic imports with variable paths
 * - Mastra recommends static workflow registration
 * - This registry provides a lookup function for the workflow loader
 */

// Static workflow imports
import { sendSiteContentToEmailWorkflow } from "./wf-auUlyla9_YGv/workflow";
// {{WORKFLOW_IMPORTS}}

// Registry maps workflow ID → workflow object
const workflowRegistry: Record<string, unknown> = {
  "wf-auUlyla9_YGv": sendSiteContentToEmailWorkflow,
  // {{WORKFLOW_ENTRIES}}
};

/**
 * Retrieves a workflow from the registry by ID.
 * @param workflowId - The workflow ID (e.g., "wf-auUlyla9_YGv")
 * @returns The workflow object or null if not found
 */
export function getWorkflowFromRegistry(workflowId: string): unknown | null {
  return workflowRegistry[workflowId] ?? null;
}

/**
 * Returns all registered workflow IDs.
 * Useful for debugging and listing available workflows.
 */
export function getRegisteredWorkflowIds(): string[] {
  return Object.keys(workflowRegistry);
}
