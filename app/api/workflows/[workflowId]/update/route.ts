import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
  readWorkflow, 
  writeWorkflow,
} from "@/app/api/workflows/services/storage";
import { WorkflowDefinitionValidator } from "@/app/api/workflows/types";
import type { StepBindings } from "@/app/api/workflows/types/bindings";
import { transpileWorkflow } from "./services/transpiler";
import { writeWorkflowCode } from "./services/storage/code-writer";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

/**
 * PATCH /api/workflows/[workflowId]/update
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
export async function PATCH(
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
      bindings = body.bindings || {};
    } else {
      // Direct workflow format: { id, name, steps, ... }
      updates = body;
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
