import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { initiateConnection } from "../services/composio";

export const runtime = "nodejs";

type ConnectRequest = {
  authConfigId: string;
  redirectUri?: string;
};

/**
 * POST /api/integrations/connect
 * Initiates OAuth connection flow for the authenticated user.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ConnectRequest;
    const { authConfigId, redirectUri } = body;

    if (!authConfigId || typeof authConfigId !== "string") {
      return NextResponse.json(
        { message: "authConfigId is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(`[connections/connect] Initiating connection for user: ${userId}, authConfig: ${authConfigId}`);

    const connection = await initiateConnection(userId, authConfigId, redirectUri);

    return NextResponse.json({
      redirectUrl: connection.redirectUrl,
      connectionStatus: connection.status,
    });
  } catch (error) {
    console.error("[connections/connect] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initiate connection";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

