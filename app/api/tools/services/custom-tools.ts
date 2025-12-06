/**
 * Custom Tools Service
 * 
 * Handles loading and caching of custom workflow tools from the filesystem.
 * Tools are stored in _tables/tools/{name}/tool.js
 */

import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import type { ToolDefinition } from "@/_tables/types";

const TOOLS_DIR = path.join(process.cwd(), "_tables", "tools");
const TOOL_FILENAME = "tool.js";

let toolCache: ToolDefinition[] | null = null;

/**
 * Loads all executable tools from the file system.
 */
export async function getExecutableTools(): Promise<ToolDefinition[]> {
  if (toolCache) return toolCache;

  const tools: ToolDefinition[] = [];

  try {
    // Ensure directory exists (silently fail if not, returning empty list)
    await fs.access(TOOLS_DIR).catch(() => null);
    const entries = await fs.readdir(TOOLS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const toolId = `workflow-${entry.name}`; // Convention
      const filePath = path.join(TOOLS_DIR, entry.name, TOOL_FILENAME);

      try {
        await fs.access(filePath);
        
        // Dynamic import needs file:// URL
        const fileUrl = pathToFileURL(filePath).href;
        console.log(`[CustomTools] Attempting to load tool ${entry.name} from ${fileUrl}`);
        
        const loadedModule = await import(fileUrl);
        console.log(`[CustomTools] Successfully imported module for ${entry.name}, exports:`, Object.keys(loadedModule));

        // Expecting export name convention: "workflowTestToolDefinition"
        // CamelCase logic: workflow-test -> workflowTest
        const camelId = toolId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const exportName = `${camelId}ToolDefinition`;
        
        console.log(`[CustomTools] Looking for export: ${exportName} (from toolId: ${toolId})`);
        const def = loadedModule[exportName];

        if (def && def.id && def.run) {
          console.log(`[CustomTools] Successfully loaded tool ${entry.name} with id: ${def.id}`);
          tools.push(def as ToolDefinition);
        } else {
          console.warn(`[CustomTools] Tool ${entry.name} missing export ${exportName} or invalid structure. Available exports:`, Object.keys(loadedModule));
          if (def) {
            console.warn(`[CustomTools] Export found but invalid:`, { hasId: !!def.id, hasRun: !!def.run });
          }
        }
      } catch (e) {
        // Log import errors with full stack trace
        console.error(`[CustomTools] Failed to load tool ${entry.name}:`, e);
        if (e instanceof Error) {
          console.error(`[CustomTools] Error stack:`, e.stack);
        }
      }
    }
  } catch (e) {
    console.error("[CustomTools] Error scanning tools:", e);
  }

  toolCache = tools;
  return tools;
}

/**
 * Clears the tool cache, forcing reload on next access.
 */
export function clearToolCache() {
  toolCache = null;
}

/**
 * Gets a custom tool by its ID.
 * @param id - The tool ID (e.g., "workflow-my-tool")
 */
export async function getCustomToolById(id: string): Promise<ToolDefinition | undefined> {
  const tools = await getExecutableTools();
  return tools.find((t) => t.id === id);
}

