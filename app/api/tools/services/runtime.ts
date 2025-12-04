import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { tool } from "ai";
import { z } from "zod";
import type { ToolDefinition } from "@/_tables/types";
import { getComposioClient, getToolAction } from "@/app/api/connections/services/composio";

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

/**
 * Checks if a tool ID is a Composio tool (prefixed with "composio-").
 */
function isComposioToolId(id: string): boolean {
  return id.startsWith("composio-");
}

/**
 * Extracts the Composio action name from a tool ID.
 * Example: "composio-gmail_send_email" -> "GMAIL_SEND_EMAIL"
 */
function extractComposioActionName(id: string): string {
  const withoutPrefix = id.replace(/^composio-/, "");
  // Convert kebab-case or snake_case to UPPER_SNAKE_CASE
  return withoutPrefix
    .replace(/-/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

/**
 * Converts a Composio tool to a Vercel AI SDK ToolDefinition.
 * This wraps the Composio tool execution in the standard tool() format.
 */
async function convertComposioToolToDefinition(
  composioTool: any,
  toolId: string,
  userId: string
): Promise<ToolDefinition> {
  // Extract schema from Composio tool
  const parameters = composioTool.parameters || {};
  
  // Convert Composio parameters to Zod schema
  const zodSchema = convertComposioSchemaToZod(parameters);
  
  // Create Vercel AI SDK tool wrapper
  // Note: Composio tools may already be in Vercel format, but we wrap for consistency
  const toolName = composioTool.name || composioTool.slug || extractComposioActionName(toolId);
  const toolDescription = composioTool.description || composioTool.name || `Composio tool: ${toolId}`;
  
  const vercelTool = tool({
    description: toolDescription,
    inputSchema: zodSchema,
    execute: async (input: Record<string, unknown>) => {
      // Execute via Composio SDK
      // Composio SDK: tools.execute(userId, actionName, params)
      const client = getComposioClient();
      try {
        const result = await client.tools.execute(userId, toolName, input);
        return result;
      } catch (error) {
        console.error(`[Runtime] Composio tool execution failed for ${toolId}:`, error);
        throw error;
      }
    },
  });

  return {
    id: toolId,
    name: composioTool.name || toolId,
    description: composioTool.description || `Composio integration tool: ${toolId}`,
    runtime: "composio",
    run: vercelTool,
  };
}

/**
 * Converts Composio parameter schema to Zod schema.
 * This is a simplified converter - Composio schemas may be more complex.
 */
function convertComposioSchemaToZod(parameters: Record<string, any>): z.ZodObject<any> {
  const zodShape: Record<string, z.ZodTypeAny> = {};
  
  for (const [key, param] of Object.entries(parameters)) {
    const paramType = param.type || param.schema?.type || "string";
    const description = param.description || param.schema?.description;
    
    let zodType: z.ZodTypeAny;
    
    switch (paramType.toLowerCase()) {
      case "string":
        zodType = z.string();
        break;
      case "number":
      case "integer":
        zodType = z.number();
        break;
      case "boolean":
        zodType = z.boolean();
        break;
      case "array":
        zodType = z.array(z.any());
        break;
      case "object":
        zodType = z.record(z.any());
        break;
      default:
        zodType = z.any();
    }
    
    if (description) {
      zodType = zodType.describe(description);
    }
    
    if (param.required === false || param.schema?.required === false) {
      zodType = zodType.optional();
    }
    
    zodShape[key] = zodType;
  }
  
  return z.object(zodShape);
}

export async function getExecutableToolById(
  id: string,
  userId?: string
): Promise<ToolDefinition | undefined> {
  // Check if this is a Composio tool
  if (isComposioToolId(id)) {
    try {
      // For MVP, use provided userId or default test user
      const effectiveUserId = userId || "agipo_test_user";
      
      const actionName = extractComposioActionName(id);
      console.log(`[Runtime] Loading Composio tool: ${id} -> ${actionName} for user: ${effectiveUserId}`);
      
      const composioTool = await getToolAction(effectiveUserId, actionName);
      
      if (!composioTool) {
        console.warn(`[Runtime] Composio tool not found: ${actionName}`);
        return undefined;
      }
      
      const toolDef = await convertComposioToolToDefinition(composioTool, id, effectiveUserId);
      console.log(`[Runtime] Successfully loaded Composio tool: ${id}`);
      return toolDef;
    } catch (error) {
      console.error(`[Runtime] Failed to load Composio tool ${id}:`, error);
      return undefined;
    }
  }
  
  // Fall back to local tools
  const tools = await getExecutableTools();
  return tools.find((t) => t.id === id);
}

