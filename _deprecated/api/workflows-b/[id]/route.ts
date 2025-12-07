/**
 * Workflows B Single Workflow API
 * 
 * GET    /api/workflows-b/[id] - Get workflow details
 * PUT    /api/workflows-b/[id] - Update workflow
 * DELETE /api/workflows-b/[id] - Delete workflow
 */

import { NextResponse } from "next/server";
import { 
  getWorkflow, 
  saveWorkflow, 
  deleteWorkflow, 
  workflowExists 
} from "../services/storage";
import type { 
  UpdateWorkflowRequest,
  GetWorkflowResponse,
  UpdateWorkflowResponse,
  DeleteWorkflowResponse,
  ApiErrorResponse 
} from "../types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/workflows-b/[id]
 * Get the complete editor state for a workflow.
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    const editorState = await getWorkflow(id);
    
    if (!editorState) {
      const errorResponse: ApiErrorResponse = {
        error: "Workflow not found",
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    const response: GetWorkflowResponse = {
      editorState,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting workflow:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to get workflow",
      code: "GET_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * PUT /api/workflows-b/[id]
 * Update a workflow's editor state.
 */
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateWorkflowRequest;
    
    // Check if workflow exists
    if (!await workflowExists(id)) {
      const errorResponse: ApiErrorResponse = {
        error: "Workflow not found",
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    let editorState = await getWorkflow(id);
    
    if (!editorState) {
      const errorResponse: ApiErrorResponse = {
        error: "Failed to read workflow",
        code: "READ_ERROR",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    // If full editor state is provided, use it (with ID preserved)
    if (body.editorState) {
      editorState = {
        ...body.editorState,
        workflow: {
          ...body.editorState.workflow,
          id, // Preserve the original ID
        },
      };
    } else {
      // Apply partial updates
      if (body.name !== undefined) {
        editorState.workflow.name = body.name;
      }
      if (body.description !== undefined) {
        editorState.workflow.description = body.description;
      }
      if (body.status !== undefined) {
        editorState.workflow.status = body.status;
      }
    }
    
    // Save the updated state
    const savedState = await saveWorkflow(id, editorState);
    
    const response: UpdateWorkflowResponse = {
      success: true,
      editorState: savedState,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating workflow:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to update workflow",
      code: "UPDATE_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * DELETE /api/workflows-b/[id]
 * Delete a workflow and its folder.
 */
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    
    // Check if workflow exists
    if (!await workflowExists(id)) {
      const errorResponse: ApiErrorResponse = {
        error: "Workflow not found",
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    const success = await deleteWorkflow(id);
    
    if (!success) {
      const errorResponse: ApiErrorResponse = {
        error: "Failed to delete workflow",
        code: "DELETE_ERROR",
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    const response: DeleteWorkflowResponse = {
      success: true,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting workflow:", error);
    
    const errorResponse: ApiErrorResponse = {
      error: "Failed to delete workflow",
      code: "DELETE_ERROR",
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}




