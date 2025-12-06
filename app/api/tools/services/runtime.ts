import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { tool, type Tool } from "ai";
import { z } from "zod";
import type { ToolDefinition, ConnectionToolBinding } from "@/_tables/types";
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
        
        const loadedModule = await import(fileUrl);
        console.log(`[Runtime] Successfully imported module for ${entry.name}, exports:`, Object.keys(loadedModule));

        // Expecting export name convention: "workflowTestToolDefinition"
        // CamelCase logic: workflow-test -> workflowTest
        const camelId = toolId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        const exportName = `${camelId}ToolDefinition`;
        
        console.log(`[Runtime] Looking for export: ${exportName} (from toolId: ${toolId})`);
        const def = loadedModule[exportName];

        if (def && def.id && def.run) {
          console.log(`[Runtime] Successfully loaded tool ${entry.name} with id: ${def.id}`);
          tools.push(def as ToolDefinition);
        } else {
          console.warn(`[Runtime] Tool ${entry.name} missing export ${exportName} or invalid structure. Available exports:`, Object.keys(loadedModule));
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

// Type for Composio tool structure
type ComposioToolShape = {
  name?: string;
  slug?: string;
  displayName?: string;
  description?: string;
  parameters?: Record<string, unknown>;
};

/**
 * Converts a Composio tool to a Vercel AI SDK ToolDefinition.
 * This wraps the Composio tool execution in the standard tool() format.
 */
async function convertComposioToolToDefinition(
  composioTool: ComposioToolShape,
  toolId: string,
  userId: string
): Promise<ToolDefinition> {
  // Extract schema from Composio tool
  // tools.get() returns { function: { parameters: {...} } }
  // getRawComposioTools() returns { inputParameters: {...} }
  type ComposioToolShape = {
    function?: { parameters?: Record<string, unknown> };
    inputParameters?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    name?: string;
    slug?: string;
    description?: string;
  };
  const typedTool = composioTool as ComposioToolShape;
  const parameters = typedTool.function?.parameters || typedTool.inputParameters || typedTool.parameters || {};
  
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
      // Composio SDK: tools.execute(slug, { userId, arguments, ... })
      const client = getComposioClient();
      try {
        const result = await client.tools.execute(toolName, {
          userId,
          arguments: input,
          dangerouslySkipVersionCheck: true, // For MVP, skip version check
        });
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
    run: vercelTool as Tool<unknown, unknown>,
  };
}

// Type for JSON Schema property definition (Composio uses JSON Schema)
type JsonSchemaProperty = {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
};

// Type for Composio parameter schema (JSON Schema format)
type ComposioParameterSchema = {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  description?: string;
};

/**
 * Converts Composio parameter schema (JSON Schema) to Zod schema.
 * Composio tools use JSON Schema format with { type: "object", properties: {...}, required: [...] }
 */
function convertComposioSchemaToZod(parameters: Record<string, unknown>): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const zodShape: Record<string, z.ZodTypeAny> = {};
  
  // Composio returns JSON Schema format
  const schema = parameters as ComposioParameterSchema;
  const properties = schema.properties || {};
  const requiredFields = schema.required || [];
  
  console.log(`[Runtime] Converting schema - properties: ${Object.keys(properties).join(', ') || 'none'}, required: ${requiredFields.join(', ') || 'none'}`);
  
  // If no properties but parameters has keys, treat parameters as the properties directly (fallback)
  const propsToIterate = Object.keys(properties).length > 0 
    ? properties 
    : (parameters as Record<string, JsonSchemaProperty>);
  
  for (const [key, propValue] of Object.entries(propsToIterate)) {
    // Skip JSON Schema meta fields if iterating over raw parameters
    if (['type', 'properties', 'required', 'description', 'additionalProperties'].includes(key)) {
      continue;
    }
    
    const prop = propValue as JsonSchemaProperty;
    const propType = prop.type || "string";
    const description = prop.description;
    const isRequired = requiredFields.includes(key);
    
    let zodType: z.ZodTypeAny;
    
    switch (propType.toLowerCase()) {
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
        zodType = z.record(z.string(), z.any());
        break;
      default:
        zodType = z.any();
    }
    
    if (description) {
      zodType = zodType.describe(description);
    }
    
    // Mark as optional if NOT in required array
    if (!isRequired) {
      zodType = zodType.optional();
    }
    
    zodShape[key] = zodType;
  }
  
  // If we ended up with an empty schema, add a passthrough to allow any input
  if (Object.keys(zodShape).length === 0) {
    console.warn('[Runtime] Empty schema generated, using passthrough');
    return z.object({}).passthrough();
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

/**
 * Gets an executable tool for a connection tool binding.
 * Uses the specific connectionId to ensure the tool uses the correct account.
 * @param userId - The authenticated user's ID
 * @param binding - The connection tool binding with toolId, connectionId, and toolkitSlug
 */
export async function getConnectionToolExecutable(
  userId: string,
  binding: ConnectionToolBinding
): Promise<ToolDefinition | undefined> {
  try {
    console.log(`[Runtime] Loading connection tool: ${binding.toolId} for connection: ${binding.connectionId}`);
    
    const client = getComposioClient();
    
    // Get the tool definition from Composio
    const composioTool = await getToolAction(userId, binding.toolId);
    
    if (!composioTool) {
      console.warn(`[Runtime] Connection tool not found: ${binding.toolId}`);
      return undefined;
    }

    // Extract schema from Composio tool
    // Composio SDK returns { type: "function", function: { parameters: {...} } }
    type ComposioToolShape = {
      function?: { parameters?: Record<string, unknown> };
      parameters?: Record<string, unknown>;
    };
    const typedTool = composioTool as ComposioToolShape;
    const parameters = typedTool.function?.parameters || typedTool.parameters || {};
    const zodSchema = convertComposioSchemaToZod(parameters);
    
    const toolDescription = 
      (composioTool as { description?: string }).description || 
      (composioTool as { name?: string }).name || 
      `${binding.toolkitSlug} tool: ${binding.toolId}`;
    
    // Determine if this is a NO_AUTH platform tool (no connectionId)
    const isNoAuth = !binding.connectionId;
    
    // Create Vercel AI SDK tool wrapper with the specific connection
    const vercelTool = tool({
      description: toolDescription,
      inputSchema: zodSchema,
      execute: async (input: Record<string, unknown>) => {
        console.log(`[Runtime] Executing ${isNoAuth ? "platform" : "connection"} tool: ${binding.toolId}`);
        console.log(`[Runtime] Input arguments:`, JSON.stringify(input, null, 2));
        
        // Filter out Mastra runtime context that shouldn't be passed to Composio
        // These are internal Mastra keys that get injected into tool calls
        const runtimeContextKeys = ['threadId', 'resourceId', 'memory', 'runId', 'runtimeContext', 'writer', 'tracingContext', 'mastra'];
        
        // First, check if actual tool args are nested in a 'context' wrapper
        // This happens when Mastra wraps the model's tool arguments
        let toolArgs: Record<string, unknown> = {};
        
        if (input.context && typeof input.context === 'object') {
          // Extract args from the context wrapper
          const contextObj = input.context as Record<string, unknown>;
          for (const [key, value] of Object.entries(contextObj)) {
            if (!runtimeContextKeys.includes(key)) {
              toolArgs[key] = value;
            }
          }
          console.log(`[Runtime] Extracted args from context wrapper:`, Object.keys(toolArgs).join(', ') || '(none)');
        }
        
        // If no args found in context, try top-level (filtering out runtime keys)
        if (Object.keys(toolArgs).length === 0) {
          for (const [key, value] of Object.entries(input)) {
            if (!runtimeContextKeys.includes(key) && key !== 'context') {
              toolArgs[key] = value;
            }
          }
          console.log(`[Runtime] Using top-level args:`, Object.keys(toolArgs).join(', ') || '(none)');
        }
        
        console.log(`[Runtime] Final arguments for Composio:`, JSON.stringify(toolArgs, null, 2));
        
        try {
          // Build execute options
          const executeOptions: {
            userId: string;
            arguments: Record<string, unknown>;
            connectedAccountId?: string;
            dangerouslySkipVersionCheck?: boolean;
          } = {
            userId,
            arguments: toolArgs,
            dangerouslySkipVersionCheck: true, // For MVP, skip version check
          };
          
          // Only pass connectedAccountId for authenticated connections (not NO_AUTH)
          if (!isNoAuth) {
            executeOptions.connectedAccountId = binding.connectionId;
          }
          
          console.log(`[Runtime] Calling Composio execute with options:`, JSON.stringify({
            toolId: binding.toolId,
            userId: executeOptions.userId,
            connectedAccountId: executeOptions.connectedAccountId || '(none - NO_AUTH)',
            argumentKeys: Object.keys(toolArgs),
          }, null, 2));
          
          // Execute via Composio SDK
          const result = await client.tools.execute(binding.toolId, executeOptions);
          
          // Truncate large results to prevent overwhelming the model
          // 10,000 chars is ~2,500 words - enough for useful content without context overflow
          const TOOL_RESULT_MAX_CHARS = 10000;
          let processedResult = result;
          
          // Handle result truncation for content returned to model
          if (result && typeof result === 'object' && 'data' in result) {
            const data = result.data as Record<string, unknown>;
            if (data && typeof data.content === 'string' && data.content.length > TOOL_RESULT_MAX_CHARS) {
              const originalLength = data.content.length;
              processedResult = {
                ...result,
                data: {
                  ...data,
                  content: data.content.substring(0, TOOL_RESULT_MAX_CHARS) + 
                    `\n\n[Content truncated from ${originalLength} to ${TOOL_RESULT_MAX_CHARS} characters]`,
                },
              };
              console.log(`[Runtime] Truncated tool result content from ${originalLength} to ${TOOL_RESULT_MAX_CHARS} chars`);
            }
          }
          
          // Log result (truncate for logging only)
          const resultStr = typeof processedResult === 'string' ? processedResult : JSON.stringify(processedResult, null, 2);
          const logTruncated = resultStr.length > 1000 
            ? resultStr.substring(0, 1000) + `...[log truncated, total ${resultStr.length} chars]` 
            : resultStr;
          console.log(`[Runtime] Tool result for ${binding.toolId}:`, logTruncated);
          
          return processedResult;
        } catch (error) {
          console.error(`[Runtime] Connection tool execution failed for ${binding.toolId}:`, error);
          if (error instanceof Error) {
            console.error(`[Runtime] Error details:`, {
              name: error.name,
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 5).join('\n'),
            });
          }
          throw error;
        }
      },
    });

    console.log(`[Runtime] Successfully loaded connection tool: ${binding.toolId}`);
    
    return {
      id: binding.toolId,
      name: (composioTool as { name?: string }).name || binding.toolId,
      description: toolDescription,
      runtime: "composio",
      run: vercelTool as Tool<unknown, unknown>,
    };
  } catch (error) {
    console.error(`[Runtime] Failed to load connection tool ${binding.toolId}:`, error);
    return undefined;
  }
}

