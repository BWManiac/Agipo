import fs from "fs/promises";
import { getWorkflowDir, getWorkflowGeneratedCodePath } from "@/app/api/workflows/services/storage/utils";

/**
 * Writes generated TypeScript code to the workflow directory.
 * 
 * @param workflowId - The workflow ID
 * @param code - The generated TypeScript code
 */
export async function writeWorkflowCode(
  workflowId: string,
  code: string
): Promise<void> {
  const dir = getWorkflowDir(workflowId);
  await fs.mkdir(dir, { recursive: true });

  const codePath = getWorkflowGeneratedCodePath(workflowId);
  await fs.writeFile(codePath, code, "utf-8");
}

/**
 * Reads generated TypeScript code from the workflow directory.
 * 
 * @param workflowId - The workflow ID
 * @returns The generated code or null if not found
 */
export async function readWorkflowCode(
  workflowId: string
): Promise<string | null> {
  try {
    const codePath = getWorkflowGeneratedCodePath(workflowId);
    return await fs.readFile(codePath, "utf-8");
  } catch {
    return null;
  }
}

