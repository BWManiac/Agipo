import fs from "fs/promises";
import path from "path";
import type { WorkflowDefinition, WorkflowSummary } from "./types";
import { WorkflowDefinitionValidator } from "./types";

const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");
const DEFINITION_FILENAME = "workflow.json";
const GENERATED_FILENAME = "workflow.ts";

/**
 * Ensure the workflows directory exists
 */
async function ensureDir() {
  await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
}

/**
 * Get the path to a workflow's directory
 */
function getWorkflowDir(id: string): string {
  return path.join(WORKFLOWS_DIR, id);
}

/**
 * List all workflow definitions
 */
export async function listWorkflows(): Promise<WorkflowSummary[]> {
  await ensureDir();
  
  try {
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    
    const results = await Promise.all(
      entries
        .filter((e) => e.isDirectory() && !e.name.startsWith("."))
        .map(async (e) => {
          const workflow = await readWorkflow(e.name);
          if (!workflow) return null;
          
          return {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            lastModified: workflow.lastModified,
            stepCount: workflow.steps.length,
            published: workflow.published,
          } satisfies WorkflowSummary;
        })
    );
    
    return results.filter((w): w is WorkflowSummary => w !== null);
  } catch (error) {
    console.error("Error listing workflows:", error);
    return [];
  }
}

/**
 * Read a specific workflow definition
 */
export async function readWorkflow(id: string): Promise<WorkflowDefinition | null> {
  try {
    const filePath = path.join(getWorkflowDir(id), DEFINITION_FILENAME);
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    
    // Validate the structure
    return WorkflowDefinitionValidator.parse(parsed);
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Write a workflow definition
 */
export async function writeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
  await ensureDir();
  
  const dir = getWorkflowDir(workflow.id);
  await fs.mkdir(dir, { recursive: true });
  
  // Update lastModified
  const updatedWorkflow: WorkflowDefinition = {
    ...workflow,
    lastModified: new Date().toISOString(),
  };
  
  const filePath = path.join(dir, DEFINITION_FILENAME);
  await fs.writeFile(filePath, JSON.stringify(updatedWorkflow, null, 2));
  
  return updatedWorkflow;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    const dir = getWorkflowDir(id);
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return false;
  }
}

/**
 * Check if a workflow exists
 */
export async function workflowExists(id: string): Promise<boolean> {
  try {
    const filePath = path.join(getWorkflowDir(id), DEFINITION_FILENAME);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save generated workflow TypeScript code
 */
export async function writeGeneratedCode(id: string, code: string): Promise<void> {
  const dir = getWorkflowDir(id);
  await fs.mkdir(dir, { recursive: true });
  
  const filePath = path.join(dir, GENERATED_FILENAME);
  await fs.writeFile(filePath, code);
}

/**
 * Read generated workflow TypeScript code
 */
export async function readGeneratedCode(id: string): Promise<string | null> {
  try {
    const filePath = path.join(getWorkflowDir(id), GENERATED_FILENAME);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}




