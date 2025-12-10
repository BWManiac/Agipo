/**
 * Test endpoint for Anchor Browser SDK
 * GET /api/browser-automation/test
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Check environment
  const hasApiKey = !!process.env.ANCHOR_API_KEY;
  const apiKeyPrefix = process.env.ANCHOR_API_KEY?.slice(0, 10) + "...";

  if (!hasApiKey) {
    return NextResponse.json({
      status: "error",
      message: "ANCHOR_API_KEY is not set",
      env: {
        hasApiKey: false,
      },
    });
  }

  // Try to import and test SDK
  try {
    const AnchorBrowser = (await import("anchorbrowser")).default;
    const client = new AnchorBrowser({
      apiKey: process.env.ANCHOR_API_KEY!,
    });

    // Try to list sessions (read-only operation)
    const response = await fetch(
      "https://api.anchorbrowser.io/v1/sessions/all/status",
      {
        headers: {
          "anchor-api-key": process.env.ANCHOR_API_KEY!,
        },
      }
    );

    const listResult = await response.json();

    return NextResponse.json({
      status: "ok",
      message: "Anchor Browser SDK is configured correctly",
      env: {
        hasApiKey: true,
        apiKeyPrefix,
      },
      sdk: {
        imported: true,
        clientCreated: !!client,
      },
      api: {
        listSessionsStatus: response.status,
        sessionCount: listResult.sessions?.length ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      env: {
        hasApiKey: true,
        apiKeyPrefix,
      },
    });
  }
}
