import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  listConnections,
  listAuthConfigs,
  getToolsForConnection,
} from "@/app/api/connections/services/composio";

export const runtime = "nodejs";

/**
 * Connection tool response shape
 */
type ConnectionToolInfo = {
  connectionId: string;
  toolkitSlug: string;
  toolkitName: string;
  toolkitLogo?: string;
  accountLabel: string;
  status: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

/**
 * GET /api/workforce/[agentId]/tools/connection/available
 * Returns all connection tools available to the authenticated user.
 * Tools are grouped by connection (account).
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's connections
    const connectionsResponse = await listConnections(userId);
    const connections = connectionsResponse.items || connectionsResponse || [];

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json({ connections: [] });
    }

    // Get auth configs for enriching connection data
    const authConfigsResponse = await listAuthConfigs();
    const authConfigs = authConfigsResponse.items || authConfigsResponse || [];

    // Create map of toolkit slug -> auth config for quick lookup
    const authConfigByToolkit = new Map<string, {
      name?: string;
      toolkit?: { name?: string; logo?: string };
    }>();
    for (const config of authConfigs) {
      const slug = config.toolkit?.slug;
      if (slug && !authConfigByToolkit.has(slug)) {
        authConfigByToolkit.set(slug, config);
      }
    }

    // Build response with tools for each connection
    const result: ConnectionToolInfo[] = [];

    for (const conn of connections) {
      // Connection may have toolkit.slug or appName depending on Composio SDK version
      const toolkitSlug = conn.toolkit?.slug || (conn as { toolkitSlug?: string }).toolkitSlug || (conn as { appName?: string }).appName || "";
      if (!toolkitSlug) continue;

      // Only include active connections
      if (conn.status !== "ACTIVE") continue;

      const authConfig = authConfigByToolkit.get(toolkitSlug);
      const tools = await getToolsForConnection(toolkitSlug);

      // Access metadata if available
      const connMetadata = (conn as { metadata?: { email?: string; username?: string } }).metadata;
      
      result.push({
        connectionId: conn.id,
        toolkitSlug,
        toolkitName: authConfig?.toolkit?.name || authConfig?.name || toolkitSlug,
        toolkitLogo: authConfig?.toolkit?.logo,
        // Use connection metadata or fall back to toolkit name
        accountLabel: connMetadata?.email || connMetadata?.username || toolkitSlug,
        status: conn.status,
        tools,
      });
    }

    return NextResponse.json({ connections: result });
  } catch (error) {
    console.error("[tools/connection/available] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve available connection tools" },
      { status: 500 }
    );
  }
}

