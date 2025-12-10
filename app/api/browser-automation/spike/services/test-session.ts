/**
 * Phase 0 Spike: Session Creation Test
 *
 * Tests Anchor Browser SDK integration for session creation.
 * Validates: AC-0.1, AC-0.2, AC-0.3
 */

import AnchorBrowser from "anchorbrowser";

export interface SessionTestResult {
  success: boolean;
  session: {
    id: string;
    cdpUrl: string;
    liveViewUrl: string;
    status: string;
  };
  note: string;
}

export async function testSessionCreation(): Promise<SessionTestResult> {
  const apiKey = process.env.ANCHOR_API_KEY;

  if (!apiKey) {
    throw new Error("ANCHOR_API_KEY environment variable is not set");
  }

  const client = new AnchorBrowser({ apiKey });

  // Create session with minimal config (no proxy for testing)
  const session = await client.sessions.create({
    session: {
      // Disable proxy for easier testing
      proxy: { active: false, type: "anchor_proxy" },
      timeout: {
        max_duration: 10, // Short timeout for testing (minutes)
        idle_timeout: 5,
      },
    },
  });

  return {
    success: true,
    session: {
      id: session.data.id,
      cdpUrl: session.data.cdp_url,
      liveViewUrl: session.data.live_view_url,
      status: "created",
    },
    note: "Session created successfully. Use liveViewUrl to view in browser.",
  };
}

export async function terminateSession(sessionId: string): Promise<void> {
  const apiKey = process.env.ANCHOR_API_KEY;

  if (!apiKey) {
    throw new Error("ANCHOR_API_KEY environment variable is not set");
  }

  const client = new AnchorBrowser({ apiKey });
  await client.sessions.delete(sessionId);
}
