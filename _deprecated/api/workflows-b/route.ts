/**
 * Workflows B Collection API
 * 
 * GET  /api/workflows-b - List all workflows
 * POST /api/workflows-b - Create a new workflow
 */

import { NextResponse } from "next/server";
import { listWorkflows, createWorkflow } from "./services/storage";
import type { 
  CreateWorkflowRequest, 
  ListWorkflowsResponse, 
  CreateWorkflowResponse,
  ApiErrorResponse 
} from "./types";

/**
 * GET /api/workflows-b
 * List all workflows with summary information for the list view.
 */
export async function GET() {
  try {
    const workflows = await listWorkflows();
    
    const response: ListWorkflowsResponse = {
      workflows,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error listing workflows:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to list workflows",
      code: "LIST_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/workflows-b
 * Create a new workflow with the given name and optional description.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateWorkflowRequest;
    
    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      const errorResponse: ApiErrorResponse = {
        error: "Name is required",
        code: "VALIDATION_ERROR",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Trim and validate name length
    const name = body.name.trim();
    if (name.length === 0) {
      const errorResponse: ApiErrorResponse = {
        error: "Name cannot be empty",
        code: "VALIDATION_ERROR",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    if (name.length > 100) {
      const errorResponse: ApiErrorResponse = {
        error: "Name must be 100 characters or less",
        code: "VALIDATION_ERROR",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Create the workflow
    const editorState = await createWorkflow(name, body.description?.trim());
    
    const response: CreateWorkflowResponse = {
      id: editorState.workflow.id,
      editorState,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to create workflow",
      code: "CREATE_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}




