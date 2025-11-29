import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { WorkflowData, WorkflowSummary } from "@/_tables/types";

const TOOLS_DIR = path.join(process.cwd(), "_tables", "tools");
const SOURCE_FILENAME = "workflow.json";
const EXEC_FILENAME = "tool.js";

// Schema for validation
const ToolDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  lastModified: z.string().optional(),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

async function ensureDir() {
  await fs.mkdir(TOOLS_DIR, { recursive: true });
}

/**
 * List all tool source definitions.
 */
export async function listToolDefinitions(): Promise<WorkflowSummary[]> {
  await ensureDir();
  const entries = await fs.readdir(TOOLS_DIR, { withFileTypes: true });
  
  const results = await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map((e) => getToolDefinition(e.name))
  );

  return results
    .filter((t): t is WorkflowData => t !== null)
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || "",
      lastModified: t.lastModified,
    }));
}

/**
 * Get a specific tool definition (source).
 */
export async function getToolDefinition(id: string): Promise<WorkflowData | null> {
  try {
    const filePath = path.join(TOOLS_DIR, id, SOURCE_FILENAME);
    const content = await fs.readFile(filePath, "utf-8");
    return ToolDataSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

/**
 * Save a tool definition (source).
 */
export async function saveToolDefinition(id: string, data: Omit<WorkflowData, "id" | "lastModified">): Promise<WorkflowData> {
  await ensureDir();
  const dir = path.join(TOOLS_DIR, id);
  await fs.mkdir(dir, { recursive: true });

  const fullData: WorkflowData = {
    ...data,
    id,
    lastModified: new Date().toISOString(),
  };

  await fs.writeFile(path.join(dir, SOURCE_FILENAME), JSON.stringify(fullData, null, 2));
  return fullData;
}

/**
 * Save the executable code for a tool.
 */
export async function saveToolExecutable(id: string, code: string): Promise<void> {
  const dir = path.join(TOOLS_DIR, id);
  await fs.mkdir(dir, { recursive: true }); // Ensure dir exists
  await fs.writeFile(path.join(dir, EXEC_FILENAME), code);
}

