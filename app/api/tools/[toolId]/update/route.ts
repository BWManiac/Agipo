import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveToolDefinition, saveToolExecutable, transpileWorkflowToTool } from "@/app/api/tools/services";

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
 * PUT /api/tools/[toolId]/update
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

