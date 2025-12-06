/**
 * Composio Tools Service
 * 
 * Handles Composio tool schema conversion and execution wrapping.
 * Converts Composio's JSON Schema format to Zod schemas compatible with Vercel AI SDK.
 * 
 * WORKAROUND: This manual conversion exists because @composio/mastra requires
 * @mastra/core@^0.21.x but we use @mastra/core@0.24.6. See RUNTIME.md for details.
 */

import { tool, type Tool } from "ai";
import { z } from "zod";
import type { ToolDefinition, ConnectionToolBinding } from "@/_tables/types";
import { getComposioClient, getToolAction } from "@/app/api/connections/services/composio";

// ============================================================================
// Types
// ============================================================================

/** Composio tool structure from SDK */
type ComposioToolShape = {
  name?: string;
  slug?: string;
  displayName?: string;
  description?: string;
  function?: { parameters?: Record<string, unknown> };
  inputParameters?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
};

/** JSON Schema property definition (Composio uses JSON Schema) */
type JsonSchemaProperty = {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
};

/** Composio parameter schema (JSON Schema format) */
type ComposioParameterSchema = {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  description?: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a tool ID is a Composio tool (prefixed with "composio-").
 */
export function isComposioToolId(id: string): boolean {
  return id.startsWith("composio-");
}

/**
 * Extracts the Composio action name from a tool ID.
 * Example: "composio-gmail_send_email" -> "GMAIL_SEND_EMAIL"
 */
export function extractComposioActionName(id: string): string {
  const withoutPrefix = id.replace(/^composio-/, "");
  return withoutPrefix
    .replace(/-/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

// ============================================================================
// Schema Conversion
// ============================================================================

/**
 * Converts Composio parameter schema (JSON Schema) to Zod schema.
 * Composio tools use JSON Schema format with { type: "object", properties: {...}, required: [...] }
 */
export function convertComposioSchemaToZod(parameters: Record<string, unknown>): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const zodShape: Record<string, z.ZodTypeAny> = {};
  
  const schema = parameters as ComposioParameterSchema;
  const properties = schema.properties || {};
  const requiredFields = schema.required || [];
  
  console.log(`[ComposioTools] Converting schema - properties: ${Object.keys(properties).join(', ') || 'none'}, required: ${requiredFields.join(', ') || 'none'}`);
  
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
    
    if (!isRequired) {
      zodType = zodType.optional();
    }
    
    zodShape[key] = zodType;
  }
  
  if (Object.keys(zodShape).length === 0) {
    console.warn('[ComposioTools] Empty schema generated, using passthrough');
    return z.object({}).passthrough();
  }
  
  return z.object(zodShape);
}

// ============================================================================
// Tool Conversion
// ============================================================================

/**
 * Converts a Composio tool to a Vercel AI SDK ToolDefinition.
 * This wraps the Composio tool execution in the standard tool() format.
 */
export async function convertComposioToolToDefinition(
  composioTool: ComposioToolShape,
  toolId: string,
  userId: string
): Promise<ToolDefinition> {
  const parameters = composioTool.function?.parameters || composioTool.inputParameters || composioTool.parameters || {};
  const zodSchema = convertComposioSchemaToZod(parameters);
  
  const toolName = composioTool.name || composioTool.slug || extractComposioActionName(toolId);
  const toolDescription = composioTool.description || composioTool.name || `Composio tool: ${toolId}`;
  
  const vercelTool = tool({
    description: toolDescription,
    inputSchema: zodSchema,
    execute: async (input: Record<string, unknown>) => {
      const client = getComposioClient();
      try {
        const result = await client.tools.execute(toolName, {
          userId,
          arguments: input,
          dangerouslySkipVersionCheck: true,
        });
        return result;
      } catch (error) {
        console.error(`[ComposioTools] Execution failed for ${toolId}:`, error);
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

// ============================================================================
// Connection Tool Execution
// ============================================================================

/** Runtime context keys injected by Mastra that should NOT be passed to Composio */
const RUNTIME_CONTEXT_KEYS = ['threadId', 'resourceId', 'memory', 'runId', 'runtimeContext', 'writer', 'tracingContext', 'mastra'];

/** Maximum characters for tool result content before truncation */
const TOOL_RESULT_MAX_CHARS = 10000;

/**
 * Extracts actual tool arguments from Mastra-wrapped input.
 * Mastra injects runtime context that Composio doesn't expect.
 */
function extractToolArguments(input: Record<string, unknown>): Record<string, unknown> {
  const toolArgs: Record<string, unknown> = {};
  
  // First, check if actual tool args are nested in a 'context' wrapper
  if (input.context && typeof input.context === 'object') {
    const contextObj = input.context as Record<string, unknown>;
    for (const [key, value] of Object.entries(contextObj)) {
      if (!RUNTIME_CONTEXT_KEYS.includes(key)) {
        toolArgs[key] = value;
      }
    }
    if (Object.keys(toolArgs).length > 0) {
      console.log(`[ComposioTools] Extracted args from context wrapper:`, Object.keys(toolArgs).join(', '));
      return toolArgs;
    }
  }
  
  // Fallback: filter top-level args
  for (const [key, value] of Object.entries(input)) {
    if (!RUNTIME_CONTEXT_KEYS.includes(key) && key !== 'context') {
      toolArgs[key] = value;
    }
  }
  console.log(`[ComposioTools] Using top-level args:`, Object.keys(toolArgs).join(', ') || '(none)');
  
  return toolArgs;
}

/**
 * Truncates large tool results to prevent context overflow.
 */
function truncateToolResult(result: unknown): unknown {
  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as { data: Record<string, unknown> }).data;
    if (data && typeof data.content === 'string' && data.content.length > TOOL_RESULT_MAX_CHARS) {
      const originalLength = data.content.length;
      console.log(`[ComposioTools] Truncating result from ${originalLength} to ${TOOL_RESULT_MAX_CHARS} chars`);
      return {
        ...result,
        data: {
          ...data,
          content: data.content.substring(0, TOOL_RESULT_MAX_CHARS) + 
            `\n\n[Content truncated from ${originalLength} to ${TOOL_RESULT_MAX_CHARS} characters]`,
        },
      };
    }
  }
  return result;
}

/**
 * Gets an executable tool for a connection tool binding.
 * Uses the specific connectionId to ensure the tool uses the correct account.
 * 
 * @param userId - The authenticated user's ID
 * @param binding - The connection tool binding with toolId, connectionId, and toolkitSlug
 */
export async function getConnectionToolExecutable(
  userId: string,
  binding: ConnectionToolBinding
): Promise<ToolDefinition | undefined> {
  try {
    const isNoAuth = !binding.connectionId;
    console.log(`[ComposioTools] Loading ${isNoAuth ? "platform" : "connection"} tool: ${binding.toolId}`);
    
    const client = getComposioClient();
    const composioTool = await getToolAction(userId, binding.toolId);
    
    if (!composioTool) {
      console.warn(`[ComposioTools] Tool not found: ${binding.toolId}`);
      return undefined;
    }

    const typedTool = composioTool as ComposioToolShape;
    const parameters = typedTool.function?.parameters || typedTool.parameters || {};
    const zodSchema = convertComposioSchemaToZod(parameters);
    
    const toolDescription = 
      (composioTool as { description?: string }).description || 
      (composioTool as { name?: string }).name || 
      `${binding.toolkitSlug} tool: ${binding.toolId}`;
    
    const vercelTool = tool({
      description: toolDescription,
      inputSchema: zodSchema,
      execute: async (input: Record<string, unknown>) => {
        console.log(`[ComposioTools] Executing ${isNoAuth ? "platform" : "connection"} tool: ${binding.toolId}`);
        
        const toolArgs = extractToolArguments(input);
        console.log(`[ComposioTools] Final arguments:`, JSON.stringify(toolArgs, null, 2));
        
        try {
          const executeOptions: {
            userId: string;
            arguments: Record<string, unknown>;
            connectedAccountId?: string;
            dangerouslySkipVersionCheck?: boolean;
          } = {
            userId,
            arguments: toolArgs,
            dangerouslySkipVersionCheck: true,
          };
          
          if (!isNoAuth) {
            executeOptions.connectedAccountId = binding.connectionId;
          }
          
          const result = await client.tools.execute(binding.toolId, executeOptions);
          const processedResult = truncateToolResult(result);
          
          // Log truncated for console
          const resultStr = typeof processedResult === 'string' ? processedResult : JSON.stringify(processedResult, null, 2);
          const logStr = resultStr.length > 1000 
            ? resultStr.substring(0, 1000) + `...[log truncated, total ${resultStr.length} chars]` 
            : resultStr;
          console.log(`[ComposioTools] Result for ${binding.toolId}:`, logStr);
          
          return processedResult;
        } catch (error) {
          console.error(`[ComposioTools] Execution failed for ${binding.toolId}:`, error);
          throw error;
        }
      },
    });

    console.log(`[ComposioTools] Successfully loaded: ${binding.toolId}`);
    
    return {
      id: binding.toolId,
      name: (composioTool as { name?: string }).name || binding.toolId,
      description: toolDescription,
      runtime: isNoAuth ? "composio-platform" : "composio",
      run: vercelTool as Tool<unknown, unknown>,
    };
  } catch (error) {
    console.error(`[ComposioTools] Failed to load ${binding.toolId}:`, error);
    return undefined;
  }
}

/**
 * Gets a Composio tool by its prefixed ID (e.g., "composio-gmail_send_email").
 * Used for legacy tool ID format.
 */
export async function getComposioToolById(
  id: string,
  userId: string
): Promise<ToolDefinition | undefined> {
  if (!isComposioToolId(id)) {
    return undefined;
  }
  
  try {
    const actionName = extractComposioActionName(id);
    console.log(`[ComposioTools] Loading tool: ${id} -> ${actionName}`);
    
    const composioTool = await getToolAction(userId, actionName);
    
    if (!composioTool) {
      console.warn(`[ComposioTools] Tool not found: ${actionName}`);
      return undefined;
    }
    
    return await convertComposioToolToDefinition(composioTool as ComposioToolShape, id, userId);
  } catch (error) {
    console.error(`[ComposioTools] Failed to load ${id}:`, error);
    return undefined;
  }
}

