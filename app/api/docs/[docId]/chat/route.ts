// API Route: /api/docs/[docId]/chat
// POST - Send chat message and stream response

import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "../../services";
import { createDocAgent, getDocTools } from "./services/doc-agent";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

// POST /api/docs/[docId]/chat - Chat with agent
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const { message, agentId, threadId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Verify document exists
    const document = await getDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Create agent with document tools
    const agent = createDocAgent(docId);
    const tools = getDocTools(docId);

    // Build context message with document content
    const contextMessage = `You are helping edit a document titled "${document.frontmatter.title}".

Current document content:
---
${document.content}
---

User request: ${message}

You have access to tools to read, insert, replace, and modify the document. Use them when the user asks you to make changes to the document.`;

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate response using the agent
          const response = await agent.generate(contextMessage, {
            threadId,
            resourceId: docId,
          });

          // Stream the text response
          if (response.text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", content: response.text })}\n\n`)
            );
          }

          // Send tool calls if any
          if (response.toolCalls && response.toolCalls.length > 0) {
            for (const toolCall of response.toolCalls) {
              // Mastra toolCall has: toolCallId, toolName, args
              const tc = toolCall as unknown as { toolCallId?: string; toolName?: string; args?: unknown };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "tool_call",
                  tool: tc.toolName || "unknown",
                  args: tc.args || {},
                })}\n\n`)
              );
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("[Chat] Error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Failed to generate response" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Docs API] Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
