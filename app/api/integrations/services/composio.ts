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
 */
export async function listAuthConfigs() {
  const client = getComposioClient();
  const authConfigs = await client.authConfigs.list();
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
 * This fetches the tool schema and execution capability.
 * @param userId - The Agipo user ID (maps to Composio entity ID)
 * @param actionName - The Composio action name (e.g., "GMAIL_SEND_EMAIL")
 * @returns Tool instance that can be executed
 */
export async function getToolAction(userId: string, actionName: string) {
  const client = getComposioClient();
  
  // Fetch the tool by name - Composio SDK: tools.get(userId, { tools: [...] })
  const tools = await client.tools.get(userId, {
    tools: [actionName],
  });

  if (!tools || tools.length === 0) {
    return null;
  }

  // Composio returns a collection, extract the first tool
  // The structure may vary - check if it's an array or object with tools property
  const toolArray = Array.isArray(tools) 
    ? tools 
    : (tools as Record<string, unknown>).tools as unknown[] || [];
  
  if (toolArray.length === 0) {
    return null;
  }

  return toolArray[0];
}

