/**
 * Composio Client Service
 * 
 * Singleton factories for Composio clients with different providers.
 */

import { Composio } from "@composio/core";
import { MastraProvider } from "@composio/mastra";
import { VercelProvider } from "@composio/vercel";

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

