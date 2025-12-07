import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWorkflow, writeWorkflow } from "@/app/api/workflows/services/storage";

export const runtime = "nodejs";

// Schema for creating a new workflow
const CreateWorkflowBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * POST /api/workflows/[workflowId]/create
 * Creates a new workflow definition.
 * Note: The workflowId param is ignored for create operations - a new ID is generated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWorkflowBodySchema.parse(body);
    
    // Create workflow with the given name
    const workflow = await createWorkflow(validated.name);
    if (validated.description) {
      workflow.description = validated.description;
      await writeWorkflow(workflow);
    }
    
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    
    console.error("API Error: Failed to create workflow:", error);
    return NextResponse.json(
      { message: "Failed to create workflow" },
      { status: 500 }
    );
  }
}


