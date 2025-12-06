/**
 * Agent Chat API Route
 * 
 * HTTP handler for agent chat streaming. Business logic is in chat-service.ts.
 */

import { generateId } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  loadAgentConfig, 
  buildToolMap, 
  formatMessages, 
  createConfiguredAgent,
  type IncomingMessage 
} from "./services/chat-service";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingPayload = {
  messages?: unknown;
  context?: string;
  threadId?: string;
};

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ agentId: string }> }
) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse payload
    const payload = (await request.json()) as IncomingPayload;
    const { messages, context, threadId: incomingThreadId } = payload;
    const { agentId } = await routeContext.params;
    const threadId = incomingThreadId || generateId();

    if (!messages) {
      return NextResponse.json({ message: "Missing messages array." }, { status: 400 });
    }

    // 3. Load agent
    const agentConfig = loadAgentConfig(agentId);
    if (!agentConfig) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // 4. Build tools and format messages
    const toolMap = await buildToolMap(userId, agentConfig);
    const formattedMessages = formatMessages(messages as IncomingMessage[], context);

    // 5. Create agent and stream
    const agent = createConfiguredAgent(userId, agentConfig, toolMap);
    
    console.log(`[Chat] threadId: ${threadId}, resourceId: ${userId}`);

    try {
      const result = await agent.stream(
        formattedMessages as unknown as Parameters<typeof agent.stream>[0],
        {
          maxSteps: agentConfig.maxSteps ?? 5,
          format: 'aisdk',
          threadId,
          resourceId: userId,
        }
      );

      console.log("[Chat] Streaming response");
      const response = result.toUIMessageStreamResponse();
      response.headers.set("X-Thread-Id", threadId);
      return response;
    } catch (streamError) {
      console.error("[Chat] Stream error:", streamError);
      
      const errorMessage = streamError instanceof Error ? streamError.message : "Unknown error";
      const isTimeout = errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT");
      
      const userMessage = isTimeout 
        ? "I'm sorry, but the request took too long to process. Please try again with a simpler request."
        : "I encountered an issue while processing your request. Please try again.";
      
      return NextResponse.json({ 
        message: userMessage,
        error: errorMessage,
        threadId,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("[Chat] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      message: "I'm sorry, something went wrong on my end. Please try again.",
      error: errorMessage,
    }, { status: 200 });
  }
}
