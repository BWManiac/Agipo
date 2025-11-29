import { NextResponse } from "next/server";
import { getTools } from "./services";

export const runtime = "nodejs";

/**
 * GET /api/tools
 * Returns all available tools loaded from workflow folders.
 */
export async function GET() {
  try {
    const tools = await getTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("[api/tools] Error loading tools:", error);
    return NextResponse.json(
      { error: "Failed to load tools" },
      { status: 500 }
    );
  }
}

