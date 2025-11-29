/**
 * Tool Registry
 * 
 * Aggregates tools from workflow folders. All tools are loaded from
 * _tables/workflows/{id}/tool.ts files that are generated when workflows are saved.
 * 
 * Note: There are no built-in tools anymore - all tools come from workflows.
 */

import { loadWorkflowTools } from "./loader";
import type { ToolDefinition } from "@/_tables/types";

/**
 * All available tools loaded from workflow folders.
 * This is populated by scanning workflow folders for tool.ts files.
 */
let toolsCache: ToolDefinition[] | null = null;

/**
 * Loads all tools from workflow folders.
 * This function is async because it needs to scan the file system.
 */
async function loadAllTools(): Promise<ToolDefinition[]> {
  if (toolsCache !== null) {
    return toolsCache;
  }

  // Load tools from workflow folders only
  const workflowTools = await loadWorkflowTools();
  
  toolsCache = workflowTools;
  return toolsCache;
}

/**
 * Synchronous version that returns cached tools.
 * Use this in client components that can't use async/await.
 * Note: Tools must be loaded first via loadAllTools() (typically on server).
 */
function getToolsSync(): ToolDefinition[] {
  return toolsCache || [];
}

/**
 * Get all tools (async - loads from file system if needed).
 * Use this in server-side code.
 */
export async function getTools(): Promise<ToolDefinition[]> {
  return loadAllTools();
}

/**
 * Get a tool by ID (synchronous for client-side usage).
 * Returns undefined if tool not found.
 */
export function getToolById(id: string): ToolDefinition | undefined {
  const tools = getToolsSync();
  return tools.find((tool) => tool.id === id);
}

/**
 * Async version of getToolById for server-side usage.
 */
export async function getToolByIdAsync(id: string): Promise<ToolDefinition | undefined> {
  const tools = await getTools();
  return tools.find((tool) => tool.id === id);
}

/**
 * Export tools array for client-side usage.
 * This will be populated by loading tools server-side first.
 * For client components, this starts empty and gets populated after server-side load.
 */
export let tools: ToolDefinition[] = [];

/**
 * Initialize tools (call this on server-side to populate the cache and tools array).
 * This should be called during server-side rendering or in API routes.
 */
export async function initializeTools(): Promise<void> {
  const loadedTools = await loadAllTools();
  tools = loadedTools;
}

// Initialize tools on module load (server-side only)
if (typeof window === "undefined") {
  // Only run on server-side
  initializeTools().catch((error) => {
    console.error("[tools/index] Failed to initialize tools:", error);
  });
}
