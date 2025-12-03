import { NextResponse } from "next/server";
import { listConnections } from "../services/composio";

export const runtime = "nodejs";

/**
 * GET /api/integrations/list
 * Lists all connected accounts for a user.
 * 
 * Query params:
 *   - userId: string (optional) - The Agipo user ID (defaults to test user for MVP)
 * 
 * Returns:
 *   - Array of connection objects with id, appName, status, etc.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // For MVP, use provided userId or default test user
    // TODO: Replace with actual user authentication
    const effectiveUserId = userId || "agipo_test_user";

    console.log(`[integrations/list] Listing connections for user: ${effectiveUserId}`);

    const connections = await listConnections(effectiveUserId);

    // Transform Composio response to our API format
    const formattedConnections = connections.items.map((item) => ({
      id: item.id,
      appName: item.authConfigId || item.appUniqueId || "unknown",
      status: item.connectionStatus || "unknown",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(formattedConnections);
  } catch (error) {
    console.error("[integrations/list] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list connections";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

