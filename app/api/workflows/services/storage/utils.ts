import fs from "fs/promises";
import path from "path";

export const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

/**
 * Ensures the workflows directory exists.
 * Used by all storage operations to maintain consistent file system structure.
 * Prevents errors from missing directories.
 */
export async function ensureDir(): Promise<void> {
  await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
}

/**
 * Gets the path to a workflow's directory.
 * Builds path: _tables/workflows/{id}
 */
export function getWorkflowDir(id: string): string {
  return path.join(WORKFLOWS_DIR, id);
}

/**
 * Gets the path to a workflow's definition file.
 */
export function getWorkflowDefinitionPath(id: string): string {
  return path.join(getWorkflowDir(id), "workflow.json");
}

/**
 * Gets the path to a workflow's generated code file.
 */
export function getWorkflowGeneratedCodePath(id: string): string {
  return path.join(getWorkflowDir(id), "workflow.ts");
}


