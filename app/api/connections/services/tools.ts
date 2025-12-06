/**
 * Composio Tools Service
 * 
 * Handles fetching tools, toolkits, and triggers from Composio.
 */

import { type MastraToolCollection } from "@composio/mastra";
import { type VercelToolCollection } from "@composio/vercel";
import type { ConnectionToolBinding } from "@/_tables/types";
import { getComposioClient, getComposioMastraClient, getComposioVercelClient } from "./client";

// ============================================================================
// Tool Fetching
// ============================================================================

/**
 * Gets available tools for a user from connected apps.
 * @param userId - The Agipo user ID (maps to Composio entity ID)
 * @param toolkits - Array of toolkit names to filter by (required by Composio SDK)
 * @returns List of available tools
 */
export async function getAvailableTools(
  userId: string,
  toolkits: string[]
) {
  const client = getComposioClient();
  const tools = await client.tools.get(userId, { toolkits });
  return tools;
}

/**
 * Gets a specific tool by its action name (e.g., "GMAIL_SEND_EMAIL").
 */
export async function getToolAction(userId: string, actionName: string) {
  const client = getComposioClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools = await client.tools.get(userId, { tools: [actionName] }) as any;
  if (!tools || tools.length === 0) return null;
  const toolArray = Array.isArray(tools) ? tools : tools?.tools || [];
  return toolArray.length > 0 ? toolArray[0] : null;
}

/**
 * Gets tools available for a specific connection.
 * Uses the toolkit slug to fetch available tools.
 * @param toolkitSlug - The toolkit slug (e.g., "gmail", "slack")
 * @returns List of tools with id, name, and description
 */
export async function getToolsForConnection(toolkitSlug: string) {
  const client = getComposioClient();
  const tools = await client.tools.getRawComposioTools({ toolkits: [toolkitSlug], limit: 100 });
  
  return (tools || []).map((tool: { slug?: string; name?: string; displayName?: string; description?: string }) => ({
    id: tool.slug || tool.name || "",
    name: tool.displayName || tool.name || "",
    description: tool.description || "",
  }));
}

// ============================================================================
// Toolkit Fetching
// ============================================================================

/**
 * Gets toolkit details by slug (e.g., "gmail", "github")
 */
export async function getToolkit(slug: string) {
  const client = getComposioClient();
  return await client.toolkits.get(slug);
}

/**
 * Gets all tools for a toolkit
 */
export async function getToolsForToolkit(toolkitSlug: string) {
  const client = getComposioClient();
  return await client.tools.getRawComposioTools({ toolkits: [toolkitSlug] });
}

// ============================================================================
// Trigger Fetching
// ============================================================================

/**
 * Gets all trigger types for a toolkit.
 * Note: Composio's API seems to ignore the `toolkits` filter,
 * so we fetch all and filter client-side by toolkit.slug.
 */
export async function getTriggersForToolkit(toolkitSlug: string) {
  const client = getComposioClient();
  const normalizedSlug = toolkitSlug.toLowerCase();
  
  // Fetch all triggers (API filter is broken)
  const allTriggers = await client.triggers.listTypes({ limit: 100 });
  
  // Filter client-side by toolkit.slug
  const filtered = (allTriggers.items || []).filter(
    (trigger: { toolkit?: { slug?: string } }) => 
      trigger.toolkit?.slug?.toLowerCase() === normalizedSlug
  );
  
  return { items: filtered, totalPages: 1 };
}

// ============================================================================
// NO_AUTH Tools
// ============================================================================

/** Known NO_AUTH toolkit slugs that work without user authentication */
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

/**
 * Gets NO_AUTH toolkits with their tools.
 * These are platform-provided tools that work without user connections.
 */
export async function getNoAuthToolkits() {
  const client = getComposioClient();
  const results: Array<{
    slug: string;
    name: string;
    logo?: string;
    mode: string;
    tools: Array<{ id: string; name: string; description: string }>;
  }> = [];

  for (const slug of NO_AUTH_TOOLKIT_SLUGS) {
    try {
      const toolkit = await client.toolkits.get(slug);
      const mode = toolkit.authConfigDetails?.[0]?.mode;
      
      if (mode !== "NO_AUTH") continue;

      const tools = await client.tools.getRawComposioTools({ toolkits: [slug], limit: 100 });
      
      results.push({
        slug,
        name: toolkit.name || slug,
        logo: toolkit.meta?.logo,
        mode: "NO_AUTH",
        tools: (tools || []).map((tool: { slug?: string; name?: string; displayName?: string; description?: string }) => ({
          id: tool.slug || tool.name || "",
          name: tool.displayName || tool.name || "",
          description: tool.description || "",
        })),
      });
    } catch (e) {
      console.warn(`[ComposioTools] Failed to fetch NO_AUTH toolkit ${slug}:`, e);
    }
  }

  return results;
}

// ============================================================================
// Provider-Specific Tool Fetching (Deprecated)
// ============================================================================

/**
 * Gets Composio connection tools in Mastra-native format.
 * ⚠️ BLOCKED: MastraProvider incompatible with @mastra/core@0.24.x
 * @deprecated Use manual conversion in composio-tools.ts instead
 */
export async function getConnectionToolsForMastra(
  userId: string,
  bindings: ConnectionToolBinding[]
): Promise<MastraToolCollection> {
  if (bindings.length === 0) {
    return {};
  }

  const client = getComposioMastraClient();
  const allTools: MastraToolCollection = {};

  const bindingsByConnection = new Map<string, ConnectionToolBinding[]>();
  for (const binding of bindings) {
    const key = binding.connectionId || "NO_AUTH";
    if (!bindingsByConnection.has(key)) {
      bindingsByConnection.set(key, []);
    }
    bindingsByConnection.get(key)!.push(binding);
  }

  for (const [connectionKey, connectionBindings] of bindingsByConnection) {
    const toolIds = connectionBindings.map(b => b.toolId);
    const isNoAuth = connectionKey === "NO_AUTH";
    
    console.log(`[Composio/Mastra] Loading ${toolIds.length} ${isNoAuth ? "NO_AUTH" : "connection"} tools`);
    
    try {
      const options: { tools: string[]; connectedAccountId?: string } = {
        tools: toolIds,
      };
      
      if (!isNoAuth) {
        options.connectedAccountId = connectionKey;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tools = await client.tools.get(userId, options) as any;
      
      for (const [toolName, tool] of Object.entries(tools)) {
        allTools[toolName] = tool as MastraToolCollection[string];
      }
      
      console.log(`[Composio/Mastra] Successfully loaded: ${Object.keys(tools).join(", ")}`);
    } catch (error) {
      console.error(`[Composio/Mastra] Failed to load tools for ${connectionKey}:`, error);
    }
  }

  return allTools;
}

/**
 * Gets Composio connection tools in Vercel AI SDK format.
 * @deprecated Use manual conversion in composio-tools.ts instead
 */
export async function getConnectionToolsVercel(
  userId: string,
  bindings: ConnectionToolBinding[]
): Promise<VercelToolCollection> {
  if (bindings.length === 0) {
    return {};
  }

  const client = getComposioVercelClient();
  const allTools: VercelToolCollection = {};

  const bindingsByConnection = new Map<string, ConnectionToolBinding[]>();
  for (const binding of bindings) {
    const key = binding.connectionId || "NO_AUTH";
    if (!bindingsByConnection.has(key)) {
      bindingsByConnection.set(key, []);
    }
    bindingsByConnection.get(key)!.push(binding);
  }

  for (const [connectionKey, connectionBindings] of bindingsByConnection) {
    const toolIds = connectionBindings.map(b => b.toolId);
    const isNoAuth = connectionKey === "NO_AUTH";
    
    console.log(`[Composio/Vercel] Loading ${toolIds.length} ${isNoAuth ? "NO_AUTH" : "connection"} tools: ${toolIds.join(", ")}`);
    
    try {
      const options: { tools: string[]; connectedAccountId?: string } = {
        tools: toolIds,
      };
      
      if (!isNoAuth) {
        options.connectedAccountId = connectionKey;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tools = await client.tools.get(userId, options) as any;
      
      for (const [toolName, tool] of Object.entries(tools)) {
        allTools[toolName] = tool as VercelToolCollection[string];
      }
      
      console.log(`[Composio/Vercel] Successfully loaded: ${Object.keys(tools).join(", ")}`);
    } catch (error) {
      console.error(`[Composio/Vercel] Failed to load tools for ${connectionKey}:`, error);
    }
  }

  return allTools;
}

