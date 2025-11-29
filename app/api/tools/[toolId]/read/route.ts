import { NextRequest, NextResponse } from "next/server";
import { getWorkflowById } from "@/app/api/tools/services";

export const runtime = "nodejs";

/**
 * GET /api/tools/[toolId]/read
 * Retrieves the full data for a single tool definition.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await context.params;
    const workflow = await getWorkflowById(toolId);
    if (!workflow) {
      return NextResponse.json({ message: "Tool definition not found" }, { status: 404 });
    }
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API Error: Failed to get tool definition", error);
    return NextResponse.json(
      { message: "Failed to retrieve tool definition" },
      { status: 500 }
    );
  }
}

