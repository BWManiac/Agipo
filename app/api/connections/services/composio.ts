import { Composio } from "@composio/core";
import { MastraProvider, type MastraToolCollection } from "@composio/mastra";
import { VercelProvider, type VercelToolCollection } from "@composio/vercel";
import type { ConnectionToolBinding } from "@/_tables/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let composioClient: Composio<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let composioMastraClient: Composio<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let composioVercelClient: Composio<any> | null = null;

/**
 * Gets or initializes the Composio client singleton.
 * Uses COMPOSIO_API_KEY from environment variables.
 */
export function getComposioClient(): Composio {
  if (composioClient) {
    return composioClient;
  }

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY environment variable is not set");
  }

  composioClient = new Composio({ apiKey });
  return composioClient;
}

/**
 * Gets or initializes the Composio client with MastraProvider.
 * ⚠️ BLOCKED: Requires @mastra/core@^0.21.x but we have 0.24.6
 * @deprecated Use getComposioVercelClient() until Composio updates compatibility
 */
export function getComposioMastraClient(): Composio {
  if (composioMastraClient) {
    return composioMastraClient;
  }

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY environment variable is not set");
  }

  composioMastraClient = new Composio({
    apiKey,
    provider: new MastraProvider(),
  });
  return composioMastraClient;
}

/**
 * Gets or initializes the Composio client with VercelProvider.
 * Returns tools in Vercel AI SDK format, which Mastra Agent accepts.
 * 
 * This is the WORKING provider - @composio/vercel is up-to-date with ai@^5.0.44
 */
export function getComposioVercelClient(): Composio {
  if (composioVercelClient) {
    return composioVercelClient;
  }

  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error("COMPOSIO_API_KEY environment variable is not set");
  }

  composioVercelClient = new Composio({
    apiKey,
    provider: new VercelProvider(),
  });
  return composioVercelClient;
}

/**
 * Gets Composio connection tools in Mastra-native format.
 * ⚠️ BLOCKED: MastraProvider incompatible with @mastra/core@0.24.x
 * @deprecated Use getConnectionToolsVercel() instead
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

  // Group bindings by connection ID (or empty string for NO_AUTH tools)
  const bindingsByConnection = new Map<string, ConnectionToolBinding[]>();
  for (const binding of bindings) {
    const key = binding.connectionId || "NO_AUTH";
    if (!bindingsByConnection.has(key)) {
      bindingsByConnection.set(key, []);
    }
    bindingsByConnection.get(key)!.push(binding);
  }

  // Fetch tools for each connection
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
 * Uses VercelProvider which is compatible with current ai@^5.x
 * Mastra Agent accepts VercelTool format via ToolsInput type.
 * 
 * @param userId - The authenticated user's Clerk ID
 * @param bindings - Connection tool bindings specifying which tools to load
 * @returns Tools in Vercel AI SDK format (accepted by Mastra Agent)
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

  // Group bindings by connection ID (or empty string for NO_AUTH tools)
  const bindingsByConnection = new Map<string, ConnectionToolBinding[]>();
  for (const binding of bindings) {
    const key = binding.connectionId || "NO_AUTH";
    if (!bindingsByConnection.has(key)) {
      bindingsByConnection.set(key, []);
    }
    bindingsByConnection.get(key)!.push(binding);
  }

  // Fetch tools for each connection
  for (const [connectionKey, connectionBindings] of bindingsByConnection) {
    const toolIds = connectionBindings.map(b => b.toolId);
    const isNoAuth = connectionKey === "NO_AUTH";
    
    console.log(`[Composio/Vercel] Loading ${toolIds.length} ${isNoAuth ? "NO_AUTH" : "connection"} tools: ${toolIds.join(", ")}`);
    
    try {
      const options: { tools: string[]; connectedAccountId?: string } = {
        tools: toolIds,
      };
      
      // Only pass connectedAccountId for authenticated connections
      if (!isNoAuth) {
        options.connectedAccountId = connectionKey;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tools = await client.tools.get(userId, options) as any;
      
      // Merge into result - tools is a VercelToolCollection
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

/**
 * Lists all available auth configs from Composio.
 * These are the pre-configured integrations (gmail, github, etc.)
 * Note: Default limit is 20, so we request up to 100 to get all configs.
 */
export async function listAuthConfigs() {
  const client = getComposioClient();
  const authConfigs = await client.authConfigs.list({ limit: 100 });
  return authConfigs;
}

/**
 * Initiates an OAuth connection flow for a user.
 * @param userId - The Agipo user ID
 * @param authConfigId - The Composio auth config ID (e.g., "ac_FpW8_GwXyMBz")
 * @param redirectUri - Optional redirect URI for OAuth callback
 * @returns Connection object with redirectUrl
 */
export async function initiateConnection(
  userId: string,
  authConfigId: string,
  redirectUri?: string
) {
  const client = getComposioClient();
  
  const connection = await client.connectedAccounts.initiate(
    userId,
    authConfigId,
    {
      callbackUrl: redirectUri || "http://localhost:3000/api/integrations/callback",
    }
  );

  return connection;
}

/**
 * Lists all connected accounts for a user.
 * @param userId - The Agipo user ID (maps to Composio entity ID)
 * @returns List of connected accounts
 */
export async function listConnections(userId: string) {
  const client = getComposioClient();
  
  const connections = await client.connectedAccounts.list({
    userIds: [userId],
  });

  return connections;
}

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
  
  // Composio SDK: tools.get(userId, filters)
  // Requires at least one filter parameter
  const tools = await client.tools.get(userId, { toolkits });
  return tools;
}

/**
 * Gets a specific tool by its action name (e.g., "GMAIL_SEND_EMAIL").
 * @deprecated Use getConnectionToolsForMastra instead for agent tools
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

/**
 * Initiates an API key connection (no redirect, immediate).
 * @param userId - The Agipo user ID
 * @param authConfigId - The Composio auth config ID
 * @param apiKey - The user's API key for the service
 * @returns Connection object with status (should be ACTIVE immediately)
 */
export async function initiateApiKeyConnection(
  userId: string,
  authConfigId: string,
  apiKey: string
) {
  const client = getComposioClient();
  
  const connection = await client.connectedAccounts.initiate(
    userId,
    authConfigId,
    {
      config: {
        authScheme: "API_KEY" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        val: { generic_api_key: apiKey } as any,
      },
    }
  );

  return connection;
}

/**
 * Disconnects/deletes a connected account
 */
export async function disconnectAccount(connectionId: string) {
  const client = getComposioClient();
  return await client.connectedAccounts.delete(connectionId);
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
  
  // Map to a simpler structure - use slug (action name) as id for execution
  return (tools || []).map((tool: { slug?: string; name?: string; displayName?: string; description?: string }) => ({
    id: tool.slug || tool.name || "",
    name: tool.displayName || tool.name || "",
    description: tool.description || "",
  }));
}

/**
 * Known NO_AUTH toolkit slugs.
 * These toolkits work without any user authentication.
 */
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
      // Get toolkit details
      const toolkit = await client.toolkits.get(slug);
      const mode = toolkit.authConfigDetails?.[0]?.mode;
      
      // Only include if actually NO_AUTH
      if (mode !== "NO_AUTH") continue;

      // Get tools for this toolkit
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
      console.warn(`[composio] Failed to fetch NO_AUTH toolkit ${slug}:`, e);
    }
  }

  return results;
}

