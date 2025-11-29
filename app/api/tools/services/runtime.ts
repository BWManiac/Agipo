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
        console.log(`[Runtime] Attempting to load tool ${entry.name} from ${fileUrl}`);
        
        const module = await import(fileUrl);
        console.log(`[Runtime] Successfully imported module for ${entry.name}, exports:`, Object.keys(module));

        // Expecting export name convention: "workflowTestToolDefinition"
        // CamelCase logic: workflow-test -> workflowTest
        const camelId = toolId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const exportName = `${camelId}ToolDefinition`;
        
        console.log(`[Runtime] Looking for export: ${exportName} (from toolId: ${toolId})`);
        const def = module[exportName];

        if (def && def.id && def.run) {
          console.log(`[Runtime] Successfully loaded tool ${entry.name} with id: ${def.id}`);
          tools.push(def as ToolDefinition);
        } else {
          console.warn(`[Runtime] Tool ${entry.name} missing export ${exportName} or invalid structure. Available exports:`, Object.keys(module));
          if (def) {
            console.warn(`[Runtime] Export found but invalid:`, { hasId: !!def.id, hasRun: !!def.run });
          }
        }
      } catch (e) {
        // Log import errors with full stack trace
        console.error(`[Runtime] Failed to load tool ${entry.name}:`, e);
        if (e instanceof Error) {
          console.error(`[Runtime] Error stack:`, e.stack);
        }
      }
    }
  } catch (e) {
    console.error("[Runtime] Error scanning tools:", e);
  }

  toolCache = tools;
  return tools;
}

export function clearToolCache() {
  toolCache = null;
}

export async function getExecutableToolById(id: string): Promise<ToolDefinition | undefined> {
  const tools = await getExecutableTools();
  return tools.find((t) => t.id === id);
}

