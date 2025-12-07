import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  readWorkflow, 
  writeWorkflow, 
  deleteWorkflow,
  WorkflowDefinitionValidator,
  type WorkflowDefinition,
} from "@/app/api/workflows-d/services";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * GET /api/workflows-d/[workflowId]
 * Retrieves a specific workflow definition.
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

/**
 * PATCH /api/workflows-d/[workflowId]
 * Updates a workflow definition.
 */
export async function PATCH(
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
    
    const body = await request.json();
    
    // Merge updates with existing workflow
    const updated = {
      ...existing,
      ...body,
      id: workflowId, // Ensure ID cannot be changed
    };
    
    // Validate the merged result
    const validated = WorkflowDefinitionValidator.parse(updated) as WorkflowDefinition;
    
    // Save
    const saved = await writeWorkflow(validated);
    
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid workflow data", issues: error.issues },
        { status: 400 }
      );
    }
    
    console.error("API Error: Failed to update workflow:", error);
    return NextResponse.json(
      { message: "Failed to update workflow" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows-d/[workflowId]
 * Deletes a workflow definition.
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




