import { Composio } from "@composio/core";

let composioClient: Composio | null = null;

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
 */
export async function getToolAction(userId: string, actionName: string) {
  const client = getComposioClient();
  const tools = await client.tools.get(userId, { tools: [actionName] });
  if (!tools || tools.length === 0) return null;
  const toolArray = Array.isArray(tools) ? tools : (tools as Record<string, unknown>).tools as unknown[] || [];
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

