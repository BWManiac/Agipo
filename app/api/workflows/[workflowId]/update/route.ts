import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  readWorkflow, 
  writeWorkflow,
} from "@/app/api/workflows/services/storage";
import { WorkflowDefinitionValidator } from "@/app/api/workflows/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * PATCH /api/workflows/[workflowId]/update
 * Updates a workflow definition.
 * Enables users to save their workflow edits from the editor.
 * Merges updates with existing workflow, validates the result, and saves to workflow.json.
 * Returns 404 if workflow doesn't exist, 400 on validation errors, 500 on server errors.
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
    const validated = WorkflowDefinitionValidator.parse(updated);
    
    // Save to workflow.json
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

