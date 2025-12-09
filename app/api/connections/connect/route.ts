import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { initiateConnection, initiateApiKeyConnection } from "./services/auth";

export const runtime = "nodejs";

type ConnectRequest = {
  authConfigId: string;
  redirectUri?: string;
  // For API key connections (no redirect)
  apiKey?: string;
};

/**
 * POST /api/connections/connect
 * Initiates connection flow for the authenticated user.
 * - If apiKey is provided: Creates API key connection immediately
 * - If no apiKey: Initiates OAuth flow with redirect
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ConnectRequest;
    const { authConfigId, redirectUri, apiKey } = body;

    if (!authConfigId || typeof authConfigId !== "string") {
      return NextResponse.json(
        { message: "authConfigId is required and must be a string" },
        { status: 400 }
      );
    }

    // API Key flow - immediate connection, no redirect
    if (apiKey) {
      console.log(`[connections/connect] API key connection for user: ${userId}, authConfig: ${authConfigId}`);
      
      const connection = await initiateApiKeyConnection(userId, authConfigId, apiKey);
      
      return NextResponse.json({
        success: true,
        connectionId: connection.id,
        status: connection.status,
      });
    }

    // OAuth flow - redirect to provider
    console.log(`[connections/connect] OAuth connection for user: ${userId}, authConfig: ${authConfigId}`);

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

