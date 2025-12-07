import { NextRequest, NextResponse } from "next/server";
import { readWorkflow, deleteWorkflow } from "@/app/api/workflows/services/storage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * DELETE /api/workflows/[workflowId]/delete
 * Deletes a workflow definition.
 * Enables users to remove workflows they no longer need.
 * Deletes the workflow directory and all associated files (workflow.json, workflow.ts).
 * Returns 404 if workflow doesn't exist, 500 on server errors.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const existing = await readWorkflow(workflowId);
    
    if (!existing) {
      return NextResponse.json(
        { message: "Workflow not found" },
        { status: 404 }
      );
    }
    
    const success = await deleteWorkflow(workflowId);
    
    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete workflow" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: "Workflow deleted" });
  } catch (error) {
    console.error("API Error: Failed to delete workflow:", error);
    return NextResponse.json(
      { message: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}

