import { NextRequest, NextResponse } from "next/server";
import { listWorkflows } from "@/app/api/workflows/services/storage";

export const runtime = "nodejs";

/**
 * GET /api/workflows/available
 * Returns a list of workflows available for assignment to agents.
 * Includes workflow metadata needed for the assignment UI.
 */
export async function GET(request: NextRequest) {
  try {
    const workflows = await listWorkflows();

    // Transform to a simplified format for agent assignment
    // Note: WorkflowSummary only has basic fields - full workflow data needs separate load
    const availableWorkflows = workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      stepCount: w.stepCount,
      lastModified: w.lastModified,
      published: w.published,
    }));

    return NextResponse.json({ workflows: availableWorkflows });
  } catch (error) {
    console.error("API Error: Failed to list available workflows:", error);
    return NextResponse.json(
      { message: "Failed to list available workflows" },
      { status: 500 }
    );
  }
}


