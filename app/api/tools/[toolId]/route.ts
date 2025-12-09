import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToolDefinition, saveToolDefinition, saveToolExecutable, transpileWorkflowToTool } from "@/app/api/tools/services";

export const runtime = "nodejs";

// Schema to validate the body of a PUT request for updating a tool definition.
const UpdateToolDefinitionBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

/**
 * GET /api/tools/[toolId]
 * Retrieves the full data for a single tool definition.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await context.params;
    const workflow = await getToolDefinition(toolId);
    if (!workflow) {
      return NextResponse.json({ message: "Tool definition not found" }, { status: 404 });
    }
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API Error: Failed to get tool definition", error);
    return NextResponse.json(
      { message: "Failed to retrieve tool definition" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tools/[toolId]
 * Updates/overwrites an existing tool definition.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await context.params;
    const body = await request.json();
    const validatedBody = UpdateToolDefinitionBodySchema.parse(body);

    const savedWorkflow = await saveToolDefinition(toolId, validatedBody);

    // Transpile and save tool executable
    try {
      const toolCode = await transpileWorkflowToTool(savedWorkflow);
      await saveToolExecutable(toolId, toolCode);
    } catch (transpileError) {
      console.warn(
        `[API] Failed to transpile tool for definition ${toolId}:`,
        transpileError
      );
      // Don't fail the request, just log the warning
    }

    return NextResponse.json(savedWorkflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("API Error: Failed to save tool definition", error);
    return NextResponse.json(
      { message: "Failed to save tool definition" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tools/[toolId]
 * Deletes a tool definition.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await context.params;
    // TODO: Implement delete functionality when needed
    return NextResponse.json(
      { message: "Delete not yet implemented" },
      { status: 501 }
    );
  } catch (error) {
    console.error("API Error: Failed to delete tool definition", error);
    return NextResponse.json(
      { message: "Failed to delete tool definition" },
      { status: 500 }
    );
  }
}

