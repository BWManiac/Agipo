import { NextRequest, NextResponse } from "next/server";
import { readWorkflow, writeGeneratedCode } from "@/app/api/workflows/services/storage";
import { generateWorkflowCode } from "@/app/api/workflows/services/generator";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * POST /api/workflows/[workflowId]/generate
 * Generates Mastra TypeScript code from the workflow definition.
 */
export async function POST(
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

    // Generate the TypeScript code
    const code = generateWorkflowCode(workflow);

    // Save to disk
    await writeGeneratedCode(workflowId, code);

    return NextResponse.json({
      message: "Code generated successfully",
      preview: code.slice(0, 500) + "...",
    });
  } catch (error) {
    console.error("API Error: Failed to generate code:", error);
    return NextResponse.json(
      { message: "Failed to generate code" },
      { status: 500 }
    );
  }
}




