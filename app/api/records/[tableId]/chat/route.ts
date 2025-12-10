import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { getAgentById } from "@/_tables/agents";
import { getAgentMemory } from "@/app/api/workforce/[agentId]/chat/services/memory";
import { buildToolMap, formatMessages } from "@/app/api/workforce/[agentId]/chat/services/chat-service";
import { getTableSchema } from "@/app/api/records/services";
import { buildTableTools } from "./services/table-tools";

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
    const { messages, agentId, threadId } = body;

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

    // Create gateway and agent
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    const agent = new Agent({
      name: agentConfig.id,
      instructions: agentConfig.systemPrompt,
      model: gateway(agentConfig.model),
      tools: allTools,
      memory: getAgentMemory(agentConfig.id),
    });

    // Use table-scoped resource ID for memory
    const resourceId = `${userId}:table:${tableId}`;

    // Stream the response
    const result = await agent.stream(formattedMessages, {
      resourceId,
      threadId: threadId || undefined,
    });

    // Create streaming response
    const stream = result.toDataStreamResponse();

    // Add thread ID to headers
    const response = new Response(stream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Thread-Id": threadId || "",
      },
    });

    return response;
  } catch (error) {
    console.error("[Records Chat] Error:", error);
    return new Response("Chat failed", { status: 500 });
  }
}
