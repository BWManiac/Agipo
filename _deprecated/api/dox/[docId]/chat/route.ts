/**
 * Document Chat API Route
 * 
 * POST /api/dox/[docId]/chat
 * Streaming chat endpoint for agent document editing.
 */

import { generateId } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDocumentAgent } from "./services/document-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingPayload = {
  messages?: unknown;
  agentId?: string;
  threadId?: string;
};

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ docId: string }> }
) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const payload = (await request.json()) as IncomingPayload;
    const { messages, agentId, threadId: incomingThreadId } = payload;
    const { docId } = await routeContext.params;
    const resolvedDocId = await docId;
    const threadId = incomingThreadId || generateId();

    if (!messages) {
      return NextResponse.json(
        { message: "Missing messages array." },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { message: "Missing agentId." },
        { status: 400 }
      );
    }

    // 3. Create agent with document tools
    const agent = await createDocumentAgent(userId, agentId, resolvedDocId);

    // 4. Format messages (using chat-service helper)
    const { formatMessages } = await import("@/app/api/workforce/[agentId]/chat/services/chat-service");
    const formattedMessages = formatMessages(messages as any);

    // 5. Stream response
    try {
      const result = await agent.stream(
        formattedMessages as unknown as Parameters<typeof agent.stream>[0],
        {
        maxSteps: 5,
        format: "aisdk",
        threadId,
        resourceId: `${userId}:doc:${resolvedDocId}`,
      });

      console.log("[DOX Chat] Streaming response");
      const response = result.toUIMessageStreamResponse();
      response.headers.set("X-Thread-Id", threadId);
      return response;
    } catch (streamError) {
      console.error("[DOX Chat] Stream error:", streamError);

      const errorMessage =
        streamError instanceof Error
          ? streamError.message
          : "Unknown error";
      const isTimeout =
        errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT");

      const userMessage = isTimeout
        ? "The request took too long. Please try a simpler request."
        : "I encountered an issue processing your request. Please try again.";

      return NextResponse.json(
        {
          message: userMessage,
          error: errorMessage,
          threadId,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[DOX Chat] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "Something went wrong. Please try again.",
        error: errorMessage,
      },
      { status: 200 }
    );
  }
}
