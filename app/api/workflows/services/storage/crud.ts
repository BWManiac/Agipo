import fs from "fs/promises";
import type { WorkflowDefinition, WorkflowSummary } from "../../types";
import { WorkflowDefinitionValidator, createEmptyWorkflow } from "../../types";
import { ensureDir, getWorkflowDir, getWorkflowDefinitionPath, WORKFLOWS_DIR } from "./utils";

/**
 * Core CRUD operations for workflow definitions.
 * Enables users to save, load, list, create, and delete workflows.
 * Powers all workflow persistence operations - when users save their work, this stores it to workflow.json.
 * Validates data before writing to ensure workflow integrity.
 */
export async function readWorkflow(id: string): Promise<WorkflowDefinition | null> {
  try {
    const filePath = getWorkflowDefinitionPath(id);
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    
    // Validate the structure
    const validated = WorkflowDefinitionValidator.parse(parsed);
    return validated as WorkflowDefinition;
  } catch {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Writes a workflow definition to disk.
 * Updates lastModified timestamp automatically.
 * Creates workflow directory if it doesn't exist.
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
  
  const filePath = getWorkflowDefinitionPath(workflow.id);
  await fs.writeFile(filePath, JSON.stringify(updatedWorkflow, null, 2), "utf-8");
  
  return updatedWorkflow;
}

/**
 * Lists all workflow definitions.
 * Scans the workflows directory and returns summaries for each workflow.
 * Used by the workflow list page to show all available workflows.
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
 * Creates a new workflow with a generated ID.
 * Enables users to start a new workflow from scratch.
 * Generates a unique ID using nanoid.
 */
export async function createWorkflow(name?: string): Promise<WorkflowDefinition> {
  await ensureDir();
  
  const { nanoid } = await import("nanoid");
  
  const id = `wf-${nanoid(12)}`;
  const workflowName = name || "Untitled Workflow";
  const workflow = createEmptyWorkflow(id, workflowName);
  
  return await writeWorkflow(workflow);
}

/**
 * Deletes a workflow and its directory.
 * Removes all files associated with the workflow (workflow.json, workflow.ts).
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
 * Checks if a workflow exists.
 * Used to validate workflow IDs before operations.
 */
export async function workflowExists(id: string): Promise<boolean> {
  try {
    const filePath = getWorkflowDefinitionPath(id);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}


