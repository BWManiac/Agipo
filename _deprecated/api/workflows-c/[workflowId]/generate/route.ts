import { NextRequest, NextResponse } from "next/server";
import { getWorkflow, saveGeneratedCode } from "../../services/storage";
import { generateWorkflowCode } from "../../services/code-generator";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * POST /api/workflows-c/[workflowId]/generate
 * 
 * Generates TypeScript code for the workflow and saves it as workflow.ts
 */
export async function POST(
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

    // Generate the TypeScript code
    const code = generateWorkflowCode(workflow);

    // Save the generated code
    const saved = await saveGeneratedCode(workflowId, code);

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save generated code" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code,
      message: "Code generated and saved successfully",
    });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows-c/[workflowId]/generate
 * 
 * Returns the generated TypeScript code without saving
 */
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

    // Generate the TypeScript code
    const code = generateWorkflowCode(workflow);

    return NextResponse.json({
      code,
      workflow: workflow.name,
      stepCount: workflow.steps.length,
    });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}


