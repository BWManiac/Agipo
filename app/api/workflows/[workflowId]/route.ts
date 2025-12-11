import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  readWorkflow,
  writeWorkflow,
  deleteWorkflow,
} from "@/app/api/workflows/services/storage";
import { WorkflowDefinitionValidator } from "@/app/api/workflows/types";
import type { StepBindings } from "@/app/api/workflows/types/bindings";
import { transpileWorkflow } from "./services/transpiler";
import { writeWorkflowCode } from "./services/storage/code-writer";
import {
  addWorkflowToRegistry,
  getExportNameFromWorkflowFile,
  removeWorkflowFromRegistry,
} from "@/app/api/workflows/services/registry-updater";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * GET /api/workflows/[workflowId]
 * Retrieves a specific workflow definition.
 * Enables the editor to load a workflow when users navigate to it.
 * Returns 404 if workflow doesn't exist, 500 on server errors.
 */
export async function GET(
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
    
    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API Error: Failed to get workflow:", error);
    return NextResponse.json(
      { message: "Failed to retrieve workflow" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[workflowId]
 * Updates a workflow definition and transpiles to executable code.
 * 
 * Accepts two formats:
 * 1. Direct workflow object: { id, name, steps, ... }
 * 2. Wrapped format: { definition: {...}, bindings: {...} }
 * 
 * Saves two files:
 * - workflow.json: Editor state (steps, bindings, metadata)
 * - workflow.ts: Executable Mastra code
 * 
 * Returns success even if transpilation fails (JSON is always saved).
 */
export async function PUT(
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
    
    // Support both direct workflow and wrapped { definition, bindings } format
    let updates: Record<string, unknown>;
    let bindings: Record<string, StepBindings> = {};
    
    if (body.definition) {
      // Wrapped format: { definition: {...}, bindings: {...} }
      updates = body.definition;
      bindings = body.bindings || (updates.bindings as Record<string, StepBindings>) || {};
    } else {
      // Direct workflow format: { id, name, steps, ... }
      updates = body;
      // If bindings are in the workflow definition, use them
      if (body.bindings) {
        bindings = body.bindings as Record<string, StepBindings>;
      }
    }
    
    // Merge updates with existing workflow
    const updated = {
      ...existing,
      ...updates,
      id: workflowId, // Ensure ID cannot be changed
      lastModified: new Date().toISOString(),
    };
    
    // Validate the merged result
    const validated = WorkflowDefinitionValidator.parse(updated);
    
    // ALWAYS save workflow.json first (preserves editor state)
    const saved = await writeWorkflow(validated);
    
    // Attempt transpilation
    const result: {
      success: boolean;
      workflow: typeof saved;
      files: { json: boolean; ts: boolean };
      warnings?: string[];
    } = {
      success: true,
      workflow: saved,
      files: { json: true, ts: false },
    };

    try {
      const transpileResult = transpileWorkflow(validated, bindings);

      if (transpileResult.errors.length === 0) {
        // Transpilation succeeded - write the code
        await writeWorkflowCode(workflowId, transpileResult.code);
        result.files.ts = true;

        // Update workflow registry for Turbopack compatibility
        try {
          const exportName = await getExportNameFromWorkflowFile(workflowId);
          if (exportName) {
            await addWorkflowToRegistry(workflowId, exportName);
          }
        } catch (registryError) {
          // Registry update is not critical - log but don't fail
          console.warn(
            `[workflow-route] Failed to update registry for ${workflowId}:`,
            registryError
          );
        }
      } else {
        // Transpilation had errors but didn't throw
        result.warnings = transpileResult.errors;
      }
    } catch (error) {
      // Transpilation threw an error
      result.warnings = [
        `Transpilation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ];
    }
    
    return NextResponse.json(result);
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

/**
 * DELETE /api/workflows/[workflowId]
 * Deletes a workflow definition.
 * Enables users to remove workflows they no longer need.
 * Deletes the workflow directory and all associated files (workflow.json, workflow.ts).
 * Returns 404 if workflow doesn't exist, 500 on server errors.
 */
export async function DELETE(
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
    
    const success = await deleteWorkflow(workflowId);

    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete workflow" },
        { status: 500 }
      );
    }

    // Remove from workflow registry
    try {
      await removeWorkflowFromRegistry(workflowId);
    } catch (registryError) {
      // Registry update is not critical - log but don't fail
      console.warn(
        `[workflow-route] Failed to remove ${workflowId} from registry:`,
        registryError
      );
    }

    return NextResponse.json({ message: "Workflow deleted" });
  } catch (error) {
    console.error("API Error: Failed to delete workflow:", error);
    return NextResponse.json(
      { message: "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
