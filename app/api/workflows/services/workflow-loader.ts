import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import type { WorkflowMetadata } from "@/_tables/types";
import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";

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
  const workflowJsonPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.json");
  const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");

  try {
    // Read workflow.json
    const workflowJsonContent = await fs.readFile(workflowJsonPath, "utf-8");
    const workflow: WorkflowDefinition = JSON.parse(workflowJsonContent);

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
 * Used for runtime execution.
 */
export async function getWorkflowExecutable(workflowId: string): Promise<unknown | null> {
  const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");

  try {
    await fs.access(workflowTsPath);

    // Dynamic import needs file:// URL
    const fileUrl = pathToFileURL(path.resolve(workflowTsPath)).href;
    const module = await import(fileUrl);

    // Check for default export first
    if (module.default) {
      return module.default;
    }

    // Workflows use named exports (e.g., export const summarizeSiteEmailWorkflow = ...)
    // Look for export that has createRunAsync method (Mastra Workflow signature)
    for (const [key, value] of Object.entries(module)) {
      if (
        value &&
        typeof value === 'object' &&
        'createRunAsync' in value &&
        typeof (value as any).createRunAsync === 'function'
      ) {
        console.log(`[workflow-loader] Found workflow export: ${key}`);
        return value;
      }
    }

    console.warn(`[workflow-loader] No workflow export found in ${workflowId}. Available exports:`, Object.keys(module));
    return null;
  } catch (error) {
    console.error(`[workflow-loader] Error loading executable for ${workflowId}:`, error);
    return null;
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

