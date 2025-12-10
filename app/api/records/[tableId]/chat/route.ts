import { generateId } from "ai";
import { auth } from "@clerk/nextjs/server";
import { getAgentById } from "@/_tables/agents";
import {
  buildToolMap,
  formatMessages,
  createConfiguredAgent
} from "@/app/api/workforce/[agentId]/chat/services/chat-service";
import { getTableSchema } from "@/app/api/records/services";
import { buildTableTools } from "./services/table-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/records/[tableId]/chat
 * Stream chat with agent in table context
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { tableId } = await params;
    const body = await req.json();
    const { messages, agentId, threadId: incomingThreadId } = body;
    const threadId = incomingThreadId || generateId();

    if (!agentId) {
      return new Response("agentId required", { status: 400 });
    }

    // Load agent config
    const agentConfig = getAgentById(agentId);
    if (!agentConfig) {
      return new Response("Agent not found", { status: 404 });
    }

    // Load table schema for context
    const schema = await getTableSchema(tableId);
    if (!schema) {
      return new Response("Table not found", { status: 404 });
    }

    // Build tools: agent's existing tools + table-specific tools
    const existingTools = await buildToolMap(userId, agentConfig);
    const tableTools = await buildTableTools(tableId, userId);
    const allTools = { ...existingTools, ...tableTools };

    // Build table context for the system prompt
    const columnInfo = schema.columns
      .filter((c) => !c.id.startsWith("_") && c.id !== "id")
      .map((c) => `${c.name} (${c.type})`)
      .join(", ");

    const tableContext = `
You are helping the user with the "${schema.name}" table.
Available columns: ${columnInfo}

You have access to these table tools:
- sys_table_schema: Get table schema information
- sys_table_read: Query rows with optional filters
- sys_table_write: Insert new rows
- sys_table_update: Update existing rows by ID
- sys_table_delete: Delete rows by ID

When the user asks you to read, add, update, or delete data, use the appropriate tool.
Always confirm what you did after executing a tool.
`;

    // Format messages with table context
    const formattedMessages = formatMessages(messages, tableContext);

    // Create agent using shared service (same pattern as workforce chat)
    const agent = createConfiguredAgent(userId, agentConfig, allTools);

    // Use table-scoped resource ID for memory
    const resourceId = `${userId}:table:${tableId}`;

    console.log(`[Records Chat] tableId: ${tableId}, agentId: ${agentId}, threadId: ${threadId}`);

    try {
      // Stream the response (matching workforce chat pattern)
      const result = await agent.stream(
        formattedMessages as unknown as Parameters<typeof agent.stream>[0],
        {
          maxSteps: agentConfig.maxSteps ?? 5,
          format: 'aisdk',
          threadId,
          resourceId,
        }
      );

      console.log("[Records Chat] Streaming response");
      const response = result.toUIMessageStreamResponse();
      response.headers.set("X-Thread-Id", threadId);
      return response;
    } catch (streamError) {
      console.error("[Records Chat] Stream error:", streamError);

      const errorMessage = streamError instanceof Error ? streamError.message : "Unknown error";
      const isTimeout = errorMessage.includes("timeout") || errorMessage.includes("TIMEOUT");

      const userMessage = isTimeout
        ? "The request took too long. Please try a simpler request."
        : "I encountered an issue processing your request. Please try again.";

      return new Response(JSON.stringify({
        message: userMessage,
        error: errorMessage,
        threadId,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("[Records Chat] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      message: "Something went wrong. Please try again.",
      error: errorMessage,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
}
