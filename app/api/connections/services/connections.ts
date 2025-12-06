/**
 * Composio Connections Service
 * 
 * Handles listing connections and auth configs.
 */

import { getComposioClient } from "./client";

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

