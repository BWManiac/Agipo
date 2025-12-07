import { NextResponse } from "next/server";
import { listWorkflows } from "@/app/api/workflows/services";

export const runtime = "nodejs";

/**
 * GET /api/workflows/list
 * Retrieves a list of all saved workflow definitions.
 */
export async function GET() {
  try {
    const workflows = await listWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("API Error: Failed to list workflows:", error);
    return NextResponse.json(
      { message: "Failed to retrieve workflows" },
      { status: 500 }
    );
  }
}




