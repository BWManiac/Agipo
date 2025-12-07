import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/app/api/workflows/services/execution";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * POST /api/workflows/[workflowId]/execute
 * Execute a workflow with the provided inputs and context.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { workflowId } = await context.params;
    const body = await request.json();

    const {
      inputs = {},
      connectionIds = {},
      tableBindings = {},
      resourceId,
    } = body;

    const result = await executeWorkflow({
      workflowId,
      inputs,
      connectionIds,
      tableBindings,
      resourceId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error: Failed to execute workflow:", error);
    return NextResponse.json(
      { message: "Failed to execute workflow", success: false },
      { status: 500 }
    );
  }
}


