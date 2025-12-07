import { promises as fs } from "fs";
import path from "path";
import {
  WorkflowDefinition,
  WorkflowSummary,
  createEmptyWorkflow,
} from "@/app/api/workflows/services/types";

const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows-c");

/**
 * Ensure the workflows directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get the path to a workflow's directory
 */
function getWorkflowDir(workflowId: string): string {
  return path.join(WORKFLOWS_DIR, workflowId);
}

/**
 * Get the path to a workflow's JSON file
 */
function getWorkflowJsonPath(workflowId: string): string {
  return path.join(getWorkflowDir(workflowId), "workflow.json");
}

/**
 * Get the path to a workflow's generated TypeScript file
 */
function getWorkflowTsPath(workflowId: string): string {
  return path.join(getWorkflowDir(workflowId), "workflow.ts");
}

/**
 * Generate a unique workflow ID
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wf-${timestamp}-${random}`;
}

/**
 * Create a new workflow
 */
export async function createWorkflow(name?: string): Promise<WorkflowDefinition> {
  const id = generateId();
  const workflowName = name || "Untitled Workflow";
  const workflow = createEmptyWorkflow(id, workflowName);

  const workflowDir = getWorkflowDir(id);
  await ensureDir(workflowDir);

  const jsonPath = getWorkflowJsonPath(id);
  await fs.writeFile(jsonPath, JSON.stringify(workflow, null, 2));

  return workflow;
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
  try {
    const jsonPath = getWorkflowJsonPath(workflowId);
    const content = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(content) as WorkflowDefinition;
  } catch {
    return null;
  }
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  workflowId: string,
  updates: Partial<WorkflowDefinition>
): Promise<WorkflowDefinition | null> {
  const existing = await getWorkflow(workflowId);
  if (!existing) return null;

  const updated: WorkflowDefinition = {
    ...existing,
    ...updates,
    id: workflowId, // Ensure ID is not changed
    lastModified: new Date().toISOString(),
  };

  const jsonPath = getWorkflowJsonPath(workflowId);
  await fs.writeFile(jsonPath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(workflowId: string): Promise<boolean> {
  try {
    const workflowDir = getWorkflowDir(workflowId);
    await fs.rm(workflowDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * List all workflows
 */
export async function listWorkflows(): Promise<WorkflowSummary[]> {
  try {
    await ensureDir(WORKFLOWS_DIR);
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    
    const workflows: WorkflowSummary[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("wf-")) {
        const workflow = await getWorkflow(entry.name);
        if (workflow) {
          workflows.push({
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            lastModified: workflow.lastModified,
            stepCount: workflow.steps.length,
            published: workflow.published,
          });
        }
      }
    }
    
    // Sort by lastModified descending
    workflows.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    
    return workflows;
  } catch {
    return [];
  }
}

/**
 * Save generated TypeScript code
 */
export async function saveGeneratedCode(
  workflowId: string,
  code: string
): Promise<boolean> {
  try {
    const tsPath = getWorkflowTsPath(workflowId);
    await fs.writeFile(tsPath, code);
    return true;
  } catch {
    return false;
  }
}




