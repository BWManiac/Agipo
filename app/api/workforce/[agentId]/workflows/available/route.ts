import { NextRequest, NextResponse } from "next/server";
import { listAvailableWorkflows } from "@/app/api/workflows/services/workflow-loader";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const workflows = await listAvailableWorkflows();

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("[workflows/available] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch available workflows" },
      { status: 500 }
    );
  }
}


