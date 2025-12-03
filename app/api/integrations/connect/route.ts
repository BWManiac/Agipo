import { NextResponse } from "next/server";
import { initiateConnection } from "../services/composio";

export const runtime = "nodejs";

type ConnectRequest = {
  authConfigId: string;
  userId?: string;
  redirectUri?: string;
};

/**
 * POST /api/integrations/connect
 * Initiates OAuth connection flow for a user.
 * 
 * Request body:
 *   - authConfigId: string (required) - The Composio auth config ID
 *   - userId: string (optional) - The Agipo user ID (defaults to test user for MVP)
 *   - redirectUri: string (optional) - OAuth callback URL
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConnectRequest;
    const { authConfigId, userId, redirectUri } = body;

    if (!authConfigId || typeof authConfigId !== "string") {
      return NextResponse.json(
        { message: "authConfigId is required and must be a string" },
        { status: 400 }
      );
    }

    const effectiveUserId = userId || "agipo_test_user";

    console.log(`[integrations/connect] Initiating connection for user: ${effectiveUserId}, authConfig: ${authConfigId}`);

    const connection = await initiateConnection(
      effectiveUserId,
      authConfigId,
      redirectUri
    );

    return NextResponse.json({
      redirectUrl: connection.redirectUrl,
      connectionStatus: connection.connectionStatus,
    });
  } catch (error) {
    console.error("[integrations/connect] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to initiate connection";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

