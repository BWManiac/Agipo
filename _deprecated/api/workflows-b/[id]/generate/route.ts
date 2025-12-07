/**
 * Workflow Code Generation API
 * 
 * POST /api/workflows-b/[id]/generate - Generate workflow.ts from editor.json
 */

import { NextResponse } from "next/server";
import { 
  getWorkflow, 
  saveGeneratedCode,
  getGeneratedCodePath,
} from "../../services/storage";
import { generateWorkflowCode } from "../../services/codegen";
import type { 
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  ApiErrorResponse 
} from "../../types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/workflows-b/[id]/generate
 * Generate Mastra workflow code from the editor state.
 */
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as GenerateWorkflowRequest;
    
    // Get the workflow
    const editorState = await getWorkflow(id);
    
    if (!editorState) {
      const errorResponse: ApiErrorResponse = {
        error: "Workflow not found",
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    // Generate the code
    const code = generateWorkflowCode(editorState.workflow);
    
    // Save the generated code
    const path = await saveGeneratedCode(id, code);
    
    const response: GenerateWorkflowResponse = {
      success: true,
      path,
      code: body.force ? code : undefined, // Only return code if explicitly requested
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating workflow code:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to generate workflow code",
      code: "GENERATE_ERROR",
      details: { message: error instanceof Error ? error.message : "Unknown error" },
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/workflows-b/[id]/generate
 * Get the generated code without regenerating.
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const fs = await import("fs/promises");
    
    const path = getGeneratedCodePath(id);
    
    try {
      const code = await fs.readFile(path, "utf-8");
      
      const response: GenerateWorkflowResponse = {
        success: true,
        path,
        code,
      };
      
      return NextResponse.json(response);
    } catch {
      // File doesn't exist
      const errorResponse: ApiErrorResponse = {
        error: "Generated code not found. Generate it first with POST.",
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
  } catch (error) {
    console.error("Error reading generated code:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to read generated code",
      code: "READ_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}


