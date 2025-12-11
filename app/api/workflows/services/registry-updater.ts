/**
 * Registry Updater Service
 *
 * Handles adding and removing workflow entries from the static registry file.
 * This keeps the registry in sync with available transpiled workflows.
 */

import fs from "fs/promises";
import path from "path";

const REGISTRY_PATH = path.join(process.cwd(), "_tables", "workflows", "registry.ts");
const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

/**
 * Adds a workflow to the registry file.
 * Inserts the import statement and registry entry.
 *
 * @param workflowId - The workflow ID (e.g., "wf-auUlyla9_YGv")
 * @param exportName - The exported workflow name (e.g., "sendSiteContentToEmailWorkflow")
 */
export async function addWorkflowToRegistry(
  workflowId: string,
  exportName: string
): Promise<void> {
  try {
    let content = await fs.readFile(REGISTRY_PATH, "utf-8");

    // Check if already registered
    if (content.includes(`"${workflowId}"`)) {
      console.log(`[registry-updater] Workflow already registered: ${workflowId}`);
      return;
    }

    // Generate import line
    const importLine = `import { ${exportName} } from "./${workflowId}/workflow";`;

    // Generate registry entry
    const registryEntry = `  "${workflowId}": ${exportName},`;

    // Insert import before the marker
    content = content.replace(
      "// {{WORKFLOW_IMPORTS}}",
      `${importLine}\n// {{WORKFLOW_IMPORTS}}`
    );

    // Insert entry before the marker
    content = content.replace(
      "// {{WORKFLOW_ENTRIES}}",
      `${registryEntry}\n  // {{WORKFLOW_ENTRIES}}`
    );

    await fs.writeFile(REGISTRY_PATH, content, "utf-8");
    console.log(`[registry-updater] Added workflow to registry: ${workflowId}`);
  } catch (error) {
    console.error(`[registry-updater] Error adding workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Removes a workflow from the registry file.
 * Removes the import statement and registry entry.
 *
 * @param workflowId - The workflow ID to remove
 */
export async function removeWorkflowFromRegistry(workflowId: string): Promise<void> {
  try {
    let content = await fs.readFile(REGISTRY_PATH, "utf-8");

    // Remove import line (matches any export name)
    const importPattern = new RegExp(
      `import \\{ \\w+ \\} from "\\.\\/${workflowId}\\/workflow";\\n`,
      "g"
    );
    content = content.replace(importPattern, "");

    // Remove registry entry
    const entryPattern = new RegExp(`\\s*"${workflowId}": \\w+,\\n`, "g");
    content = content.replace(entryPattern, "\n");

    await fs.writeFile(REGISTRY_PATH, content, "utf-8");
    console.log(`[registry-updater] Removed workflow from registry: ${workflowId}`);
  } catch (error) {
    console.error(`[registry-updater] Error removing workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Extracts the export name from a workflow.ts file.
 * Looks for pattern: export const XXXWorkflow = createWorkflow
 *
 * @param workflowId - The workflow ID
 * @returns The export name or null if not found
 */
export async function getExportNameFromWorkflowFile(
  workflowId: string
): Promise<string | null> {
  const workflowPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");

  try {
    const content = await fs.readFile(workflowPath, "utf-8");

    // Match: export const someNameWorkflow = createWorkflow
    const match = content.match(/export const (\w+)\s*=\s*createWorkflow/);

    if (match && match[1]) {
      return match[1];
    }

    console.warn(`[registry-updater] No workflow export found in ${workflowId}`);
    return null;
  } catch (error) {
    console.error(`[registry-updater] Error reading workflow file ${workflowId}:`, error);
    return null;
  }
}

/**
 * Syncs the registry with all available workflow.ts files.
 * Adds missing workflows and removes stale entries.
 */
export async function syncRegistryWithWorkflows(): Promise<{
  added: string[];
  removed: string[];
}> {
  const added: string[] = [];
  const removed: string[] = [];

  try {
    // Get current registry content
    const registryContent = await fs.readFile(REGISTRY_PATH, "utf-8");

    // Get all workflow directories
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    const workflowDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("wf-"))
      .map((e) => e.name);

    // Check each workflow directory
    for (const workflowId of workflowDirs) {
      const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");
      const isTranspiled = await fs
        .access(workflowTsPath)
        .then(() => true)
        .catch(() => false);
      const isInRegistry = registryContent.includes(`"${workflowId}"`);

      if (isTranspiled && !isInRegistry) {
        // Add missing workflow
        const exportName = await getExportNameFromWorkflowFile(workflowId);
        if (exportName) {
          await addWorkflowToRegistry(workflowId, exportName);
          added.push(workflowId);
        }
      } else if (!isTranspiled && isInRegistry) {
        // Remove stale entry
        await removeWorkflowFromRegistry(workflowId);
        removed.push(workflowId);
      }
    }

    console.log(`[registry-updater] Sync complete. Added: ${added.length}, Removed: ${removed.length}`);
    return { added, removed };
  } catch (error) {
    console.error("[registry-updater] Error syncing registry:", error);
    throw error;
  }
}
