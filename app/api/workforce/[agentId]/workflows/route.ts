import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowBindings,
  updateWorkflowBindings,
} from "@/app/api/workforce/services/agent-config";
import { validateWorkflowBinding } from "@/app/api/workflows/services/workflow-loader";
import type { WorkflowBinding } from "@/_tables/types";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const bindings = getWorkflowBindings(agentId);

    return NextResponse.json({ bindings });
  } catch (error) {
    console.error("[workflows/route] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow bindings" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await request.json();
    const { bindings } = body as { bindings: WorkflowBinding[] };

    if (!Array.isArray(bindings)) {
      return NextResponse.json(
        { error: "bindings must be an array" },
        { status: 400 }
      );
    }

    // Validate each binding
    for (const binding of bindings) {
      const validation = await validateWorkflowBinding(binding);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: `Invalid binding for workflow ${binding.workflowId}`,
            details: validation.errors,
            workflowId: binding.workflowId
          },
          { status: 400 }
        );
      }
    }

    await updateWorkflowBindings(agentId, bindings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[workflows/route] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save workflow bindings" },
      { status: 500 }
    );
  }
}

