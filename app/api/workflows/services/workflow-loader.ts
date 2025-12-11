import fs from "fs/promises";
import path from "path";
import type { WorkflowMetadata } from "@/_tables/types";
import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import { getWorkflowFromRegistry } from "@/_tables/workflows/registry";

const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

/**
 * NO_AUTH toolkit slugs that don't require user connections.
 * These are platform-provided tools that work without authentication.
 */
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

/**
 * Lists all available (transpiled) workflows.
 * Only workflows with workflow.ts files are included.
 */
export async function listAvailableWorkflows(): Promise<WorkflowMetadata[]> {
  try {
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    const workflows: WorkflowMetadata[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const workflowId = entry.name;
      const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");

      try {
        // Check if workflow.ts exists (transpiled)
        await fs.access(workflowTsPath);

        // Load metadata from workflow.json (avoids dynamic import issues in Next.js)
        const metadata = await getWorkflowMetadata(workflowId);
        if (metadata) {
          workflows.push(metadata);
        }
      } catch (error) {
        // Skip workflows without workflow.ts or if metadata can't be loaded
        continue;
      }
    }

    // Sort by lastModified descending
    workflows.sort((a, b) => {
      const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return bTime - aTime;
    });

    return workflows;
  } catch (error) {
    console.error("[workflow-loader] Error listing workflows:", error);
    return [];
  }
}

/**
 * Gets metadata for a specific workflow by reading workflow.json and checking for workflow.ts.
 * This avoids dynamic import issues in Next.js by extracting metadata from JSON instead.
 */
export async function getWorkflowMetadata(workflowId: string): Promise<WorkflowMetadata | null> {
  console.log(`[workflow-loader] getWorkflowMetadata called for: ${workflowId}`);
  const workflowJsonPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.json");
  const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");
  console.log(`[workflow-loader] Reading: ${workflowJsonPath}`);

  try {
    // Read workflow.json
    const workflowJsonContent = await fs.readFile(workflowJsonPath, "utf-8");
    console.log(`[workflow-loader] JSON read success, parsing...`);
    const workflow: WorkflowDefinition = JSON.parse(workflowJsonContent);
    console.log(`[workflow-loader] JSON parsed, workflow name: ${workflow.name}`);

    // Verify workflow.ts exists (transpiled)
    await fs.access(workflowTsPath);

    // Extract requiredConnections from composio steps
    // Exclude NO_AUTH toolkits (they don't need connections)
    const requiredConnections = new Set<string>();
    for (const step of workflow.steps || []) {
      if (step.type === "composio" && step.toolkitSlug) {
        // Only include toolkits that require authentication
        if (!NO_AUTH_TOOLKIT_SLUGS.includes(step.toolkitSlug)) {
          requiredConnections.add(step.toolkitSlug);
        }
      }
    }

    return {
      id: workflowId,
      name: workflow.name || workflowId,
      description: workflow.description,
      requiredConnections: Array.from(requiredConnections),
      stepCount: workflow.steps?.length || 0,
      lastModified: workflow.lastModified,
    };
  } catch (error) {
    console.error(`[workflow-loader] Error loading metadata for ${workflowId}:`, error);
    return null;
  }
}

/**
 * Gets the executable workflow object for a workflow ID.
 * Uses the static registry to avoid Turbopack dynamic import issues.
 *
 * Note: This is intentionally a synchronous function that returns a Promise
 * to avoid async/await issues with Turbopack module resolution.
 */
export function getWorkflowExecutable(workflowId: string): Promise<unknown | null> {
  console.log(`[workflow-loader] getWorkflowExecutable called for: ${workflowId}`);

  try {
    // Use static registry lookup instead of dynamic import
    // This works with Turbopack because all imports are resolved at build time
    console.log(`[workflow-loader] Calling getWorkflowFromRegistry...`);
    const workflow = getWorkflowFromRegistry(workflowId);
    console.log(`[workflow-loader] getWorkflowFromRegistry returned: ${workflow ? 'object' : 'null'}`);

    if (workflow) {
      console.log(`[workflow-loader] Loaded workflow from registry: ${workflowId}`);
      console.log(`[workflow-loader] Workflow has .then?: ${typeof (workflow as Record<string, unknown>).then}`);
      console.log(`[workflow-loader] About to return workflow...`);
      // Wrap in object to prevent Promise from unwrapping thenable workflow object
      return Promise.resolve({ __workflow: workflow });
    }

    console.warn(`[workflow-loader] Workflow not found in registry: ${workflowId}`);
    return Promise.resolve(null);
  } catch (error) {
    console.error(`[workflow-loader] Error getting workflow executable for ${workflowId}:`, error);
    return Promise.resolve(null);
  }
}

/**
 * Validates a workflow binding by checking if all required connections are bound.
 * NO_AUTH toolkits (like browser_tool) are excluded from validation.
 */
export async function validateWorkflowBinding(binding: {
  workflowId: string;
  connectionBindings: Record<string, string>;
}): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const metadata = await getWorkflowMetadata(binding.workflowId);
  if (!metadata) {
    errors.push(`Workflow "${binding.workflowId}" not found or not transpiled`);
    return { valid: false, errors };
  }

  // Check if all required connections are bound
  // Note: requiredConnections already excludes NO_AUTH toolkits
  const missingConnections: string[] = [];
  for (const toolkitSlug of metadata.requiredConnections) {
    if (!binding.connectionBindings[toolkitSlug]) {
      missingConnections.push(toolkitSlug);
    }
  }

  if (missingConnections.length > 0) {
    if (missingConnections.length === 1) {
      errors.push(`Missing connection binding for ${missingConnections[0]}. Please select a connection in the workflow assignment panel.`);
    } else {
      errors.push(`Missing connection bindings for: ${missingConnections.join(", ")}. Please select connections in the workflow assignment panel.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

