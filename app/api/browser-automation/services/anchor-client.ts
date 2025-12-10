/**
 * Anchor Browser SDK Wrapper
 * Provides typed interface for session management operations.
 */

import AnchorBrowser from "anchorbrowser";

// Lazy client initialization to ensure env vars are loaded
let _client: AnchorBrowser | null = null;

function getClient(): AnchorBrowser {
  if (!_client) {
    const apiKey = process.env.ANCHOR_API_KEY;
    if (!apiKey) {
      throw new Error("ANCHOR_API_KEY environment variable is not set");
    }
    _client = new AnchorBrowser({ apiKey });
  }
  return _client;
}

export interface CreateSessionOptions {
  profileName?: string;
  initialUrl?: string;
  timeout?: {
    maxDuration?: number; // Minutes
    idleTimeout?: number; // Minutes
  };
  recording?: boolean;
}

export interface SessionData {
  id: string;
  cdpUrl: string;
  liveViewUrl: string;
  status: "starting" | "running" | "idle" | "stopped";
  profileName?: string;
  createdAt?: string;
}

/**
 * Create a new browser session
 */
export async function createSession(
  options?: CreateSessionOptions
): Promise<SessionData> {
  const client = getClient();
  const session = await client.sessions.create({
    browser: {
      profile: options?.profileName
        ? { name: options.profileName, persist: true }
        : undefined,
    },
    session: {
      initial_url: options?.initialUrl,
      timeout: {
        max_duration: options?.timeout?.maxDuration || 20,
        idle_timeout: options?.timeout?.idleTimeout || 5,
      },
      recording: {
        active: options?.recording ?? true,
      },
      proxy: {
        active: false,
        type: "anchor_proxy",
      },
    },
  });

  const sessionData = session.data;

  if (
    !sessionData?.id ||
    !sessionData?.cdp_url ||
    !sessionData?.live_view_url
  ) {
    throw new Error("Session creation failed: missing required session data");
  }

  return {
    id: sessionData.id,
    cdpUrl: sessionData.cdp_url,
    liveViewUrl: sessionData.live_view_url,
    status: "starting",
    profileName: options?.profileName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Terminate a browser session
 */
export async function terminateSession(sessionId: string): Promise<void> {
  const client = getClient();
  await client.sessions.delete(sessionId);
}

/**
 * List all active sessions
 */
export async function listSessions(): Promise<SessionData[]> {
  // Use REST endpoint since SDK may not have list method
  const response = await fetch(
    "https://api.anchorbrowser.io/v1/sessions/all/status",
    {
      headers: {
        "anchor-api-key": process.env.ANCHOR_API_KEY!,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list sessions: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle case where no sessions exist
  if (!data.sessions || !Array.isArray(data.sessions)) {
    return [];
  }

  return data.sessions.map((s: Record<string, unknown>) => ({
    id: s.id as string,
    cdpUrl: s.cdp_url as string,
    liveViewUrl: s.live_view_url as string,
    status: s.status as SessionData["status"],
  }));
}

/**
 * Get a single session by ID
 */
export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  try {
    const response = await fetch(
      `https://api.anchorbrowser.io/v1/sessions/${sessionId}/status`,
      {
        headers: {
          "anchor-api-key": process.env.ANCHOR_API_KEY!,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      cdpUrl: data.cdp_url,
      liveViewUrl: data.live_view_url,
      status: data.status,
    };
  } catch (error) {
    // Check if it's a 404-like error
    if ((error as { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

// Export the client getter for direct usage if needed
export { getClient as getAnchorClient };
