import { NextResponse } from "next/server";
import { listAuthConfigs } from "../services/composio";

export const runtime = "nodejs";

/**
 * GET /api/integrations/auth-configs
 * Lists all available auth configs from Composio.
 */
export async function GET() {
  try {
    const authConfigs = await listAuthConfigs();
    return NextResponse.json(authConfigs);
  } catch (error) {
    console.error("[integrations/auth-configs] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to list auth configs";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

