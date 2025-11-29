import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { Node, Edge } from "@xyflow/react";
import type { WorkflowData, WorkflowSummary } from "../types";

// Define the directory for storing workflows within the _tables pseudo-database.
const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

// Constants for folder structure
const WORKFLOW_FILE_NAME = "workflow.json";
const TOOL_FILE_NAME = "tool.ts";

// Use Zod to define a strict schema for our workflow data.
// This ensures that we only read and write well-structured data.
const WorkflowDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()), // Using z.any() for now, can be tightened later if needed
  edges: z.array(z.any()),
  lastModified: z.string().optional(),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

/**
 * A repository for managing workflows stored on the local file system.
 * This class acts as a stand-in for a real database during local development.
 * It handles all file system operations (read, write, list) for workflows.
 */
class FileSystemWorkflowRepository {
  /**
   * Ensures the _tables/workflows directory exists before any operation.
   * If it doesn't exist, it will be created.
   */
  private async ensureDirectoryExists() {
    try {
      await fs.access(WORKFLOWS_DIR);
    } catch {
      await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
    }
  }

  /**
   * Retrieves a list of summaries for all saved workflows.
   * Supports both old format (flat files) and new format (folders).
   */
  async getWorkflows(): Promise<WorkflowSummary[]> {
    await this.ensureDirectoryExists();
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    const workflowPromises: Promise<WorkflowData | null>[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // New format: folder with workflow.json inside
        workflowPromises.push(this.getWorkflowById(entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        // Old format: flat file (for backward compatibility)
        const id = path.basename(entry.name, ".json");
        workflowPromises.push(this.getWorkflowById(id));
      }
    }

    const workflows = (await Promise.all(workflowPromises)).filter(
      (wf): wf is WorkflowData => wf !== null
    );

    // Return a lighter summary object for list views.
    return workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description ?? "No description.",
      lastModified: wf.lastModified,
    }));
  }

  /**
   * Retrieves the full data for a single workflow by its ID.
   * Supports both old format (flat files) and new format (folders).
   * Automatically migrates old workflows to new format on access.
   */
  async getWorkflowById(id: string): Promise<WorkflowData | null> {
    await this.ensureDirectoryExists();
    
    // Try new format first: folder with workflow.json
    const folderPath = path.join(WORKFLOWS_DIR, id);
    const newFormatPath = path.join(folderPath, WORKFLOW_FILE_NAME);
    
    try {
      const fileContent = await fs.readFile(newFormatPath, "utf-8");
      const data = JSON.parse(fileContent);
      return WorkflowDataSchema.parse(data);
    } catch {
      // New format doesn't exist, try old format
    }
    
    // Try old format: flat JSON file (backward compatibility)
    const oldFormatPath = path.join(WORKFLOWS_DIR, `${id}.json`);
    try {
      const fileContent = await fs.readFile(oldFormatPath, "utf-8");
      const data = JSON.parse(fileContent);
      const workflow = WorkflowDataSchema.parse(data);
      
      // Migrate to new format automatically
      await this.migrateToFolderStructure(workflow);
      
      return workflow;
    } catch {
      // If neither format exists, return null
      return null;
    }
  }

  /**
   * Migrates a workflow from flat file format to folder structure.
   * Called automatically when an old format workflow is accessed.
   */
  private async migrateToFolderStructure(workflow: WorkflowData): Promise<void> {
    const folderPath = path.join(WORKFLOWS_DIR, workflow.id);
    const workflowPath = path.join(folderPath, WORKFLOW_FILE_NAME);
    const oldFilePath = path.join(WORKFLOWS_DIR, `${workflow.id}.json`);
    
    try {
      // Create folder
      await fs.mkdir(folderPath, { recursive: true });
      
      // Save workflow.json in new location
      await fs.writeFile(
        workflowPath,
        JSON.stringify(workflow, null, 2)
      );
      
      // Remove old file after successful migration
      try {
        await fs.unlink(oldFilePath);
      } catch {
        // Ignore if old file doesn't exist or can't be deleted
      }
    } catch (error) {
      console.error(
        `[WorkflowRepository] Failed to migrate workflow ${workflow.id}:`,
        error
      );
      // Don't throw - migration is best effort
    }
  }

  /**
   * Saves a workflow to the file system using folder-based structure.
   * Creates a folder {id}/ containing workflow.json.
   * If the workflow already exists, it will be overwritten.
   */
  async saveWorkflow(
    id: string,
    data: {
      name: string;
      description?: string;
      nodes: Node[];
      edges: Edge[];
      apiKeys?: Record<string, string>;
    }
  ): Promise<WorkflowData> {
    await this.ensureDirectoryExists();

    const workflowToSave: WorkflowData = {
      ...data,
      id,
      lastModified: new Date().toISOString(),
      apiKeys: data.apiKeys ?? {},
    };

    // Validate the data before writing it to disk to prevent corruption.
    const validatedData = WorkflowDataSchema.parse(workflowToSave);
    
    // Create folder for workflow
    const folderPath = path.join(WORKFLOWS_DIR, id);
    await fs.mkdir(folderPath, { recursive: true });
    
    // Save workflow.json
    const workflowPath = path.join(folderPath, WORKFLOW_FILE_NAME);
    await fs.writeFile(
      workflowPath,
      JSON.stringify(validatedData, null, 2)
    );
    
    // Clean up old flat file if it exists (migration cleanup)
    const oldFilePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    try {
      await fs.unlink(oldFilePath);
    } catch {
      // Ignore if old file doesn't exist
    }
    
    return validatedData;
  }

  /**
   * Saves the transpiled tool code for a workflow.
   * This is called separately from saveWorkflow to separate data persistence from code generation.
   */
  async saveToolCode(id: string, code: string): Promise<void> {
    await this.ensureDirectoryExists();
    
    // Ensure workflow folder exists
    const folderPath = path.join(WORKFLOWS_DIR, id);
    await fs.mkdir(folderPath, { recursive: true });
    
    // Save tool.ts
    const toolPath = path.join(folderPath, TOOL_FILE_NAME);
    await fs.writeFile(toolPath, code, "utf-8");
  }
}

// Create a singleton instance
const repository = new FileSystemWorkflowRepository();

/**
 * Public API for accessing workflows.
 * These functions abstract the underlying file system operations.
 */

export async function getWorkflows(): Promise<WorkflowSummary[]> {
  return repository.getWorkflows();
}

export async function getWorkflowById(id: string): Promise<WorkflowData | null> {
  return repository.getWorkflowById(id);
}

export async function saveWorkflow(
  id: string,
  data: {
    name: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
    apiKeys?: Record<string, string>;
  }
): Promise<WorkflowData> {
  return repository.saveWorkflow(id, data);
}

export async function saveToolCode(id: string, code: string): Promise<void> {
  return repository.saveToolCode(id, code);
}

// Export the repository instance for direct access if needed
export { repository };
