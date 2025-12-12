/**
 * POST /api/workflows/[workflowId]/execute
 *
 * Executes a workflow directly with streaming progress.
 * Returns SSE stream with step-by-step progress events.
 *
 * Request Body:
 * {
 *   inputData: { ... }  // Workflow input matching inputSchema
 * }
 *
 * Response: SSE stream with events:
 * - step-start: Step began executing
 * - step-complete: Step finished successfully
 * - step-error: Step failed
 * - workflow-complete: All steps done
 * - workflow-error: Workflow failed
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { resolveConnections } from "./services/connection-resolver";
import { executeWorkflowStream } from "./services/execution-service";
import type { ExecutionRequest, ExecutionStreamEvent } from "./types";

export const runtime = "nodejs";

// Disable response caching for SSE
export const dynamic = "force-dynamic";

/**
 * POST handler - Execute workflow with streaming
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    // 1. Authenticate
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await params;
    console.log(`[execute] Starting execution for workflow: ${workflowId}, user: ${userId}`);

    // 2. Parse request body
    let body: ExecutionRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { inputData = {} } = body;

    // 3. Resolve connections
    const { validation, bindings } = await resolveConnections(workflowId, userId);

    if (!validation.valid) {
      return NextResponse.json(
        {
          message: "Execution validation failed",
          errors: validation.errors,
          missingConnections: validation.missingConnections,
        },
        { status: 400 }
      );
    }

    // 4. Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: ExecutionStreamEvent) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Execute workflow and stream events
          for await (const event of executeWorkflowStream(
            workflowId,
            userId,
            inputData,
            bindings
          )) {
            sendEvent(event);

            // If workflow completed or errored, we're done
            if (event.type === "workflow-complete" || event.type === "workflow-error") {
              break;
            }
          }
        } catch (error) {
          // Send error event
          sendEvent({
            type: "workflow-error",
            error: error instanceof Error ? error.message : String(error),
            totalDurationMs: 0,
            timestamp: new Date().toISOString(),
          });
        } finally {
          controller.close();
        }
      },
    });

    // 5. Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("[execute] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Execution failed";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

/**
 * GET handler - Get workflow execution info (connections required, etc.)
 * Useful for UI to show connection status before execution.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await params;

    // Check what connections are required and which are available
    const { validation, bindings } = await resolveConnections(workflowId, userId);

    return NextResponse.json({
      workflowId,
      canExecute: validation.valid,
      errors: validation.errors,
      missingConnections: validation.missingConnections,
      resolvedConnections: Object.keys(bindings),
    });
  } catch (error) {
    console.error("[execute] GET Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get execution info";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
