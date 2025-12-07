import { NextRequest, NextResponse } from "next/server";
import { readWorkflow } from "@/app/api/workflows/services/storage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * GET /api/workflows/[workflowId]/retrieve
 * Retrieves a specific workflow definition.
 * Enables the editor to load a workflow when users navigate to it.
 * Returns 404 if workflow doesn't exist, 500 on server errors.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const workflow = await readWorkflow(workflowId);
    
    if (!workflow) {
      return NextResponse.json(
        { message: "Workflow not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API Error: Failed to get workflow:", error);
    return NextResponse.json(
      { message: "Failed to retrieve workflow" },
      { status: 500 }
    );
  }
}

