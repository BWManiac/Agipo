/**
 * Tools Runtime Service
 * 
 * Barrel file that re-exports from custom-tools.ts and composio-tools.ts.
 * Also provides the unified getExecutableToolById() that handles both types.
 * 
 * See RUNTIME.md for architecture documentation and known issues.
 */

import type { ToolDefinition } from "@/_tables/types";

// Re-export custom tools functions
export { 
  getExecutableTools, 
  clearToolCache, 
  getCustomToolById 
} from "./custom-tools";

// Re-export composio tools functions
export { 
  getConnectionToolExecutable,
  getComposioToolById,
  isComposioToolId,
  extractComposioActionName,
  convertComposioSchemaToZod,
} from "./composio-tools";

// Import for unified function
import { getCustomToolById } from "./custom-tools";
import { getComposioToolById, isComposioToolId } from "./composio-tools";

/**
 * Gets any executable tool by its ID.
 * Handles both custom tools (workflow-*) and Composio tools (composio-*).
 * 
 * @param id - The tool ID
 * @param userId - Optional user ID (required for Composio tools)
 */
export async function getExecutableToolById(
  id: string,
  userId?: string
): Promise<ToolDefinition | undefined> {
  // Check if this is a Composio tool
  if (isComposioToolId(id)) {
    const effectiveUserId = userId || "agipo_test_user";
    return getComposioToolById(id, effectiveUserId);
  }
  
  // Fall back to custom tools
  return getCustomToolById(id);
}
