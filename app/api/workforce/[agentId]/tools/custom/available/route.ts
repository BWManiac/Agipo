import { NextResponse } from "next/server";
import { listToolDefinitions } from "@/app/api/tools/services";

export const runtime = "nodejs";

/**
 * GET /api/workforce/[agentId]/tools/custom/available
 * Returns all available custom tools (from _tables/tools/).
 * The agentId is not used here since all custom tools are available to all agents.
 */
export async function GET() {
  try {
    const tools = await listToolDefinitions();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("[tools/custom/available] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve available tools" },
      { status: 500 }
    );
  }
}

