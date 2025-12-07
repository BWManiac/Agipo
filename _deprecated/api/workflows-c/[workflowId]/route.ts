import { NextRequest, NextResponse } from "next/server";
import { getWorkflow, updateWorkflow, deleteWorkflow } from "../services/storage";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const workflow = await getWorkflow(workflowId);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error getting workflow:", error);
    return NextResponse.json(
      { error: "Failed to get workflow" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const updates = await request.json();

    const workflow = await updateWorkflow(workflowId, updates);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;
    const success = await deleteWorkflow(workflowId);

    if (!success) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}




