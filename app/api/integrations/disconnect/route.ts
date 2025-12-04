import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { disconnectAccount } from "../services/composio";

export const runtime = "nodejs";

/**
 * DELETE /api/integrations/disconnect
 * Disconnects a connected account for the authenticated user.
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { connectionId } = await request.json();

    if (!connectionId || typeof connectionId !== "string") {
      return NextResponse.json(
        { message: "connectionId is required" },
        { status: 400 }
      );
    }

    console.log(`[integrations/disconnect] Disconnecting ${connectionId} for user: ${userId}`);

    await disconnectAccount(connectionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[integrations/disconnect] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

