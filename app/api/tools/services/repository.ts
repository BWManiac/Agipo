import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { Node, Edge } from "@xyflow/react";
import type { WorkflowData, WorkflowSummary } from "@/_tables/types";

// Define the directory for storing workflows within the _tables pseudo-database.
// We keep the data location consistent even if the logic moves.
const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

// Constants for folder structure
const WORKFLOW_FILE_NAME = "workflow.json";
const TOOL_FILE_NAME = "tool.ts";

// Use Zod to define a strict schema for our workflow data.
const WorkflowDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  lastModified: z.string().optional(),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

/**
 * A repository for managing tool definitions (workflows) stored on the local file system.
 */
class FileSystemToolRepository {
  /**
   * Ensures the _tables/workflows directory exists.
   */
  private async ensureDirectoryExists() {
    try {
      await fs.access(WORKFLOWS_DIR);
    } catch {
      await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
    }
  }

  /**
   * Retrieves a list of summaries for all saved tool definitions.
   */
  async getWorkflows(): Promise<WorkflowSummary[]> {
    await this.ensureDirectoryExists();
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });
    
    const workflowPromises = entries
      .filter(entry => entry.isDirectory())
      .map(entry => this.getWorkflowById(entry.name));

    const workflows = (await Promise.all(workflowPromises)).filter(
      (wf): wf is WorkflowData => wf !== null
    );

    return workflows.map((wf) => ({
      id: wf.id,
      name: wf.name,
      description: wf.description ?? "No description.",
      lastModified: wf.lastModified,
    }));
  }

  /**
   * Retrieves the full data for a single tool definition by its ID.
   */
  async getWorkflowById(id: string): Promise<WorkflowData | null> {
    await this.ensureDirectoryExists();
    
    const folderPath = path.join(WORKFLOWS_DIR, id);
    const filePath = path.join(folderPath, WORKFLOW_FILE_NAME);
    
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      return WorkflowDataSchema.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Saves a tool definition (workflow) to the file system.
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

    const validatedData = WorkflowDataSchema.parse(workflowToSave);
    
    const folderPath = path.join(WORKFLOWS_DIR, id);
    await fs.mkdir(folderPath, { recursive: true });
    
    const filePath = path.join(folderPath, WORKFLOW_FILE_NAME);
    await fs.writeFile(filePath, JSON.stringify(validatedData, null, 2));
    
    return validatedData;
  }

  /**
   * Saves the transpiled tool code.
   */
  async saveToolCode(id: string, code: string): Promise<void> {
    await this.ensureDirectoryExists();
    
    const folderPath = path.join(WORKFLOWS_DIR, id);
    await fs.mkdir(folderPath, { recursive: true });
    
    const toolPath = path.join(folderPath, TOOL_FILE_NAME);
    await fs.writeFile(toolPath, code, "utf-8");
  }
}

// Export singleton instance
const repository = new FileSystemToolRepository();

export const getWorkflows = repository.getWorkflows.bind(repository);
export const getWorkflowById = repository.getWorkflowById.bind(repository);
export const saveWorkflow = repository.saveWorkflow.bind(repository);
export const saveToolCode = repository.saveToolCode.bind(repository);

