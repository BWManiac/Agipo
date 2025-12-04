import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listConnections } from "../services/composio";

export const runtime = "nodejs";

/**
 * GET /api/integrations/list
 * Lists all connected accounts for the authenticated user.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log(`[connections/list] Listing connections for user: ${userId}`);

    const connections = await listConnections(userId);

    const formattedConnections = connections.items.map((item) => ({
      id: item.id,
      authConfigId: item.authConfig?.id || null,
      toolkitSlug: item.toolkit?.slug || "unknown",
      status: item.status || "unknown",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(formattedConnections);
  } catch (error) {
    console.error("[connections/list] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list connections";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

