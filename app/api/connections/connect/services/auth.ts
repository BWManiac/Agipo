/**
 * Composio Authentication Service
 * 
 * Handles OAuth and API key connection flows.
 */

import { getComposioClient } from "@/app/api/connections/services/client";

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

