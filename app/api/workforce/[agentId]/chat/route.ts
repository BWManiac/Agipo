import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import type { Tool } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentById } from "@/_tables/agents";
import { getExecutableToolById, getConnectionToolExecutable } from "@/app/api/tools/services";

export const runtime = "nodejs";
export const maxDuration = 30;

type IncomingPayload = {
  messages?: unknown;
  agentId?: string;
  agentName?: string;
  context?: string;
};

// Message type for incoming messages from the frontend
type IncomingMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ agentId: string }> }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as IncomingPayload;
    const { messages, context } = payload;
    const { agentId } = await routeContext.params;

    if (!messages) {
      return NextResponse.json({ message: "Missing messages array." }, { status: 400 });
    }

    // Load agent from registry
    const requestedAgentId = agentId ?? "pm";
    const agentConfig = getAgentById(requestedAgentId);
    
    if (!agentConfig) {
      console.error(`[workforce/agent] Agent not found: ${requestedAgentId}`);
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    console.log(`[workforce/agent] Loading agent: ${requestedAgentId}`);
    console.log(`[workforce/agent] Model: ${agentConfig.model}, ToolIds: [${agentConfig.toolIds.join(", ")}]`);
    console.log(`[workforce/agent] ConnectionToolBindings: ${agentConfig.connectionToolBindings?.length || 0}`);

    // Build tool map dynamically from agent's toolIds (custom tools)
    const toolMap: Record<string, Tool<unknown, unknown>> = {};
    for (const toolId of agentConfig.toolIds) {
      const toolDef = await getExecutableToolById(toolId);
      if (!toolDef) {
        console.warn(`[workforce/agent] Custom tool not found: ${toolId}; skipping.`);
        continue;
      }
      toolMap[toolId] = toolDef.run;
    }

    // Build tool map for connection tools
    const connectionBindings = agentConfig.connectionToolBindings || [];
    for (const binding of connectionBindings) {
      const toolDef = await getConnectionToolExecutable(userId, binding);
      if (!toolDef) {
        console.warn(`[workforce/agent] Connection tool not found: ${binding.toolId}; skipping.`);
        continue;
      }
      // Use the tool ID as the key so the agent can call it
      toolMap[binding.toolId] = toolDef.run;
    }

    // Create gateway for model routing
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    // Instantiate Mastra agent dynamically with registry config
    const dynamicAgent = new Agent({
      name: agentConfig.id,
      instructions: agentConfig.systemPrompt,
      model: gateway(agentConfig.model),
      tools: toolMap,
    });

    // Format messages for Mastra
    // The frontend sends messages in UI format (with parts array or content)
    const incomingMessages = messages as IncomingMessage[];
    const formattedMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

    // Add context as system message if provided
    if (context) {
      formattedMessages.push({
        role: "system",
        content: `Additional context for this session:\n${context}`,
      });
    }

    // Convert incoming messages to simple role/content format
    for (const msg of incomingMessages) {
      let content = "";
      
      // Handle both content string and parts array format
      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((part) => part.type === "text" && part.text)
          .map((part) => part.text)
          .join("\n");
      }

      if (content) {
        formattedMessages.push({
          role: msg.role,
          content,
        });
      }
    }

    console.log("[workforce/agent] messages:", formattedMessages.length);
    console.log(`[workforce/agent] Tools available: ${Object.keys(toolMap).length > 0 ? Object.keys(toolMap).join(", ") : "none"}`);
    
    // Stream response using Mastra agent with AI SDK compatible format
    const result = await dynamicAgent.stream(
      formattedMessages as unknown as Parameters<typeof dynamicAgent.stream>[0], 
      {
        maxSteps: agentConfig.maxSteps ?? 5,
        format: 'aisdk',
      }
    );

    console.log("[workforce/agent] streaming response");
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[workforce/agent] error:", error);
    return NextResponse.json({ message: "Agent failed to respond." }, { status: 500 });
  }
}
