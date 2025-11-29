import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { Node, Edge } from "@xyflow/react";
import type { WorkflowData, WorkflowSummary } from "../types";

// Define the directory for storing workflows within the _tables pseudo-database.
const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

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
   * It reads the directory and parses each file to get its metadata.
   */
  async getWorkflows(): Promise<WorkflowSummary[]> {
    await this.ensureDirectoryExists();
    const files = await fs.readdir(WORKFLOWS_DIR);
    const workflowPromises = files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const id = path.basename(file, ".json");
        return this.getWorkflowById(id);
      });

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
   */
  async getWorkflowById(id: string): Promise<WorkflowData | null> {
    await this.ensureDirectoryExists();
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      // Validate the data against our schema before returning it.
      return WorkflowDataSchema.parse(data);
    } catch {
      // If the file doesn't exist or is invalid, return null.
      return null;
    }
  }

  /**
   * Saves a workflow to the file system.
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
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);

    const workflowToSave: WorkflowData = {
      ...data,
      id,
      lastModified: new Date().toISOString(),
      apiKeys: data.apiKeys ?? {},
    };

    // Validate the data before writing it to disk to prevent corruption.
    const validatedData = WorkflowDataSchema.parse(workflowToSave);
    await fs.writeFile(filePath, JSON.stringify(validatedData, null, 2));
    return validatedData;
  }
}

// Create a singleton instance
const repository = new FileSystemWorkflowRepository();

/**
 * Registry functions following the same pattern as agents and tools.
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

// Export the repository instance for direct access if needed
export { repository };

