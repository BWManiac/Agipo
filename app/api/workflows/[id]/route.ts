import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowById, saveWorkflow } from "@/_tables/workflows";

/**
 * GET /api/workflows/[id]
 * Retrieves the full data for a single workflow.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workflow = await getWorkflowById(id);
    if (!workflow) {
      return NextResponse.json({ message: "Workflow not found" }, { status: 404 });
    }
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API Error: Failed to get workflow", error);
    return NextResponse.json(
      { message: "Failed to retrieve workflow" },
      { status: 500 }
    );
  }
}

// Schema to validate the body of a PUT request for updating a workflow.
const UpdateWorkflowBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

/**
 * PUT /api/workflows/[id]
 * Updates/overwrites an existing workflow.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedBody = UpdateWorkflowBodySchema.parse(body);

    const savedWorkflow = await saveWorkflow(id, validatedBody);
    return NextResponse.json(savedWorkflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("API Error: Failed to save workflow", error);
    return NextResponse.json(
      { message: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
