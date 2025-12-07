import fs from "fs/promises";
import { ensureDir, getWorkflowDir, getWorkflowGeneratedCodePath } from "./utils";

/**
 * Stores generated TypeScript code that executes workflows.
 * When users save a workflow, system generates executable Mastra code and stores it in workflow.ts.
 * Enables workflows to be executed by agents and other systems.
 * Separate from workflow.json (editor state) because generated code is derived from definition.
 */
export async function writeGeneratedCode(id: string, code: string): Promise<void> {
  await ensureDir();
  
  const dir = getWorkflowDir(id);
  await fs.mkdir(dir, { recursive: true });
  
  const filePath = getWorkflowGeneratedCodePath(id);
  await fs.writeFile(filePath, code, "utf-8");
}

/**
 * Reads generated workflow TypeScript code.
 * Returns null if file doesn't exist.
 */
export async function readGeneratedCode(id: string): Promise<string | null> {
  try {
    const filePath = getWorkflowGeneratedCodePath(id);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}


