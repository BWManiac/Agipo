/**
 * Browser Automation Chat API
 * SSE endpoint for streaming chat with Anchor's agent
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { executeAgentTask, type AgentStep } from "../../../services/anchor-agent";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
});

export const runtime = "nodejs";
export const maxDuration = 120;

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * POST /api/browser-automation/sessions/[sessionId]/chat
 * Execute a natural language task and stream results via SSE
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { sessionId } = await params;

  // Validate request
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validated = ChatRequestSchema.safeParse(body);
  if (!validated.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Note: We skip session verification here because Anchor's status API
  // can return errors even for valid sessions. The agent.task() call
  // will fail gracefully if the session doesn't exist.

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: unknown) => {
    try {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    } catch (e) {
      console.error("Failed to write to stream:", e);
    }
  };

  // Execute agent task in background
  (async () => {
    try {
      // Send initial acknowledgment
      await sendEvent("message", {
        type: "working",
        content: `Working on: "${validated.data.message}"`,
      });

      const result = await executeAgentTask(
        sessionId,
        validated.data.message,
        {
          onStep: async (step: AgentStep) => {
            if (step.status === "running") {
              await sendEvent("step_start", step);
            } else if (step.status === "success") {
              await sendEvent("step_complete", step);
            } else if (step.status === "error") {
              await sendEvent("step_error", step);
            }
          },
          timeout: 90000, // 90 seconds
        }
      );

      if (result.success) {
        await sendEvent("result", {
          success: true,
          data: result.result,
        });
      } else {
        await sendEvent("error", {
          message: result.error || "Task failed",
        });
      }

      await sendEvent("done", {});
    } catch (error) {
      console.error("Chat task error:", error);
      await sendEvent("error", { message: (error as Error).message });
    } finally {
      try {
        await writer.close();
      } catch {
        // Stream may already be closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
