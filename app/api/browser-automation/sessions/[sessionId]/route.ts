/**
 * Browser Automation Session API
 * GET    - Get session details
 * DELETE - Terminate session
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession, terminateSession } from "../../services/anchor-client";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/browser-automation/sessions/[sessionId]
 * Get details for a specific session
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/browser-automation/sessions/[sessionId]
 * Terminate a specific session
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await terminateSession(sessionId);

    return NextResponse.json({
      success: true,
      message: "Session terminated",
    });
  } catch (error) {
    console.error("Failed to terminate session:", error);
    return NextResponse.json(
      { error: "Failed to terminate session" },
      { status: 500 }
    );
  }
}
