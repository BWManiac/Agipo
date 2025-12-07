/**
 * Workflows B Storage Service
 * 
 * Handles file system operations for workflow storage in _tables/workflows-b/.
 * Each workflow is stored in its own folder with:
 * - editor.json: The complete editor state (workflow definition + UI state)
 * - workflow.ts: Generated Mastra workflow code (created by code generator)
 */

import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { EditorState, WorkflowDefinition } from "@/_tables/workflows-b/types";
import { createEmptyEditorState } from "@/_tables/workflows-b/types";
import type { WorkflowListItem } from "../types";

// Base directory for workflows storage
const BASE_DIR = path.join(process.cwd(), "_tables", "workflows-b");

/**
 * Ensure the base directory exists.
 */
async function ensureBaseDir(): Promise<void> {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

/**
 * Get the path to a workflow folder.
 */
function getWorkflowDir(id: string): string {
  return path.join(BASE_DIR, id);
}

/**
 * Get the path to a workflow's editor.json file.
 */
function getEditorJsonPath(id: string): string {
  return path.join(getWorkflowDir(id), "editor.json");
}

/**
 * Get the path to a workflow's workflow.ts file.
 */
function getWorkflowTsPath(id: string): string {
  return path.join(getWorkflowDir(id), "workflow.ts");
}

/**
 * Generate a URL-safe unique ID for a new workflow.
 */
export function generateId(): string {
  return nanoid(10);
}

/**
 * Generate a URL-safe slug from a name.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40) || generateId();
}

/**
 * Check if a workflow exists.
 */
export async function workflowExists(id: string): Promise<boolean> {
  try {
    await fs.access(getEditorJsonPath(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * List all workflows with summary information.
 */
export async function listWorkflows(): Promise<WorkflowListItem[]> {
  await ensureBaseDir();
  
  try {
    const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });
    const workflows: WorkflowListItem[] = [];

    for (const entry of entries) {
      // Skip non-directories and hidden files
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

      const workflowId = entry.name;
      const editorJsonPath = getEditorJsonPath(workflowId);

      try {
        const content = await fs.readFile(editorJsonPath, "utf-8");
        const state: EditorState = JSON.parse(content);
        const workflow = state.workflow;

        // Extract unique platforms from steps
        const platforms = [...new Set(
          workflow.steps
            .filter(s => s.platform)
            .map(s => s.platform!)
        )];

        workflows.push({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          stepCount: workflow.steps.length,
          lastModified: workflow.updatedAt,
          platforms,
        });
      } catch (error) {
        // Skip invalid workflow folders
        console.warn(`Skipping invalid workflow folder: ${workflowId}`, error);
      }
    }

    // Sort by last modified, newest first
    workflows.sort((a, b) => {
      const dateA = new Date(a.lastModified || 0).getTime();
      const dateB = new Date(b.lastModified || 0).getTime();
      return dateB - dateA;
    });

    return workflows;
  } catch (error) {
    console.error("Error listing workflows:", error);
    return [];
  }
}

/**
 * Get a workflow's complete editor state.
 */
export async function getWorkflow(id: string): Promise<EditorState | null> {
  try {
    const content = await fs.readFile(getEditorJsonPath(id), "utf-8");
    return JSON.parse(content) as EditorState;
  } catch (error) {
    console.error(`Error reading workflow ${id}:`, error);
    return null;
  }
}

/**
 * Create a new workflow.
 */
export async function createWorkflow(
  name: string,
  description?: string
): Promise<EditorState> {
  await ensureBaseDir();

  // Generate ID from name or random
  const baseId = slugify(name);
  let id = baseId;
  
  // Ensure unique ID
  let attempt = 0;
  while (await workflowExists(id)) {
    attempt++;
    id = `${baseId}-${nanoid(4)}`;
    if (attempt > 10) {
      id = generateId();
      break;
    }
  }

  // Create workflow folder
  const workflowDir = getWorkflowDir(id);
  await fs.mkdir(workflowDir, { recursive: true });

  // Create initial editor state
  const editorState = createEmptyEditorState(id, name);
  if (description) {
    editorState.workflow.description = description;
  }

  // Write editor.json
  await fs.writeFile(
    getEditorJsonPath(id),
    JSON.stringify(editorState, null, 2),
    "utf-8"
  );

  return editorState;
}

/**
 * Save a workflow's editor state.
 */
export async function saveWorkflow(
  id: string,
  state: EditorState
): Promise<EditorState> {
  const workflowDir = getWorkflowDir(id);
  
  // Ensure folder exists
  await fs.mkdir(workflowDir, { recursive: true });

  // Update the timestamp
  state.workflow.updatedAt = new Date().toISOString();

  // Write editor.json with pretty formatting
  await fs.writeFile(
    getEditorJsonPath(id),
    JSON.stringify(state, null, 2),
    "utf-8"
  );

  return state;
}

/**
 * Update specific fields of a workflow.
 */
export async function updateWorkflow(
  id: string,
  updates: Partial<WorkflowDefinition>
): Promise<EditorState | null> {
  const state = await getWorkflow(id);
  if (!state) return null;

  // Apply updates to the workflow
  Object.assign(state.workflow, updates);
  
  return saveWorkflow(id, state);
}

/**
 * Delete a workflow and its folder.
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    const workflowDir = getWorkflowDir(id);
    await fs.rm(workflowDir, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Error deleting workflow ${id}:`, error);
    return false;
  }
}

/**
 * Save generated workflow code.
 */
export async function saveGeneratedCode(
  id: string,
  code: string
): Promise<string> {
  const workflowTsPath = getWorkflowTsPath(id);
  await fs.writeFile(workflowTsPath, code, "utf-8");
  return workflowTsPath;
}

/**
 * Check if generated code exists.
 */
export async function hasGeneratedCode(id: string): Promise<boolean> {
  try {
    await fs.access(getWorkflowTsPath(id));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the path to the workflow's generated code file.
 */
export function getGeneratedCodePath(id: string): string {
  return getWorkflowTsPath(id);
}




