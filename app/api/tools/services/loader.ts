/**
 * Workflow Tools Loader
 * 
 * Scans workflow folders and dynamically loads tool definitions from tool.ts files.
 * Tools are stored in workflow folders: _tables/workflows/{id}/tool.ts
 */

import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import type { ToolDefinition } from "@/_tables/types";

const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");
const TOOL_FILE_NAME = "tool.ts";

/**
 * Cache for loaded tools to avoid repeated file system access
 */
let cachedTools: ToolDefinition[] | null = null;

/**
 * Loads all workflow tools from workflow folders.
 * Scans _tables/workflows/{id}/tool.ts files and dynamically imports ToolDefinition exports.
 */
export async function loadWorkflowTools(): Promise<ToolDefinition[]> {
  // Return cached tools if available
  if (cachedTools !== null) {
    return cachedTools;
  }

  const tools: ToolDefinition[] = [];

  try {
    // Ensure workflows directory exists
    await fs.access(WORKFLOWS_DIR);
  } catch {
    // Directory doesn't exist, return empty array
    cachedTools = [];
    return cachedTools;
  }

  try {
    const entries = await fs.readdir(WORKFLOWS_DIR, { withFileTypes: true });

    // Process each workflow folder
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const workflowId = entry.name;
      const toolFilePath = path.join(WORKFLOWS_DIR, workflowId, TOOL_FILE_NAME);

      try {
        // Check if tool.ts file exists
        await fs.access(toolFilePath);

        // Dynamically import the tool file
        // Note: In Next.js, we need to use relative imports from process.cwd()
        
        try {
          // Use dynamic import with file:// URL for server-side ES module loading
          // Convert absolute path to file:// URL
          const toolModuleUrl = pathToFileURL(path.resolve(toolFilePath)).href;
          const toolModule = await import(toolModuleUrl) as Record<string, unknown>;

          // The transpiler exports a ToolDefinition with id: "workflow-{workflowId}"
          // Look for any export that matches ToolDefinition shape
          // Try common export name pattern first
          const toolId = `workflow-${workflowId}`;
          const camelCaseId = toolId
            .split("-")
            .map((word, i) =>
              i === 0
                ? word
                : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join("");
          
          const toolDefExportName = `${camelCaseId}ToolDefinition`;
          
          // Try the expected export name first
          let toolDef = toolModule[toolDefExportName];
          
          // If not found, search for any ToolDefinition export
          if (!toolDef || typeof toolDef !== "object" || !("id" in toolDef) || !("run" in toolDef)) {
            // Search all exports for a ToolDefinition
            for (const key in toolModule) {
              const exportValue = toolModule[key];
              if (
                exportValue &&
                typeof exportValue === "object" &&
                "id" in exportValue &&
                (exportValue as ToolDefinition).id === toolId &&
                "run" in exportValue
              ) {
                toolDef = exportValue;
                break;
              }
            }
          }

          if (toolDef && typeof toolDef === "object" && "id" in toolDef && "run" in toolDef) {
            tools.push(toolDef as ToolDefinition);
          } else {
            console.warn(
              `[workflow-tools-loader] Tool file ${toolFilePath} does not export valid ToolDefinition with id "${toolId}"`
            );
          }
        } catch (importError) {
          console.warn(
            `[workflow-tools-loader] Failed to import tool from ${toolFilePath}:`,
            importError
          );
        }
      } catch {
        // tool.ts file doesn't exist, skip this workflow
        continue;
      }
    }
  } catch (error) {
    console.error("[workflow-tools-loader] Error scanning workflow folders:", error);
  }

  cachedTools = tools;
  return tools;
}

/**
 * Clears the tool cache. Useful when tools are added/removed.
 */
export function clearToolCache(): void {
  cachedTools = null;
}

