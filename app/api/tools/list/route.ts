import { NextResponse } from "next/server";
import { getWorkflows } from "@/app/api/tools/services";

export const runtime = "nodejs";

/**
 * GET /api/tools/list
 * Retrieves a list of all saved tool definitions (workflows).
 */
export async function GET() {
  try {
    const workflows = await getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("API Error: Failed to get tool definitions:", error);
    return NextResponse.json(
      { message: "Failed to retrieve tool definitions" },
      { status: 500 }
    );
  }
}

