import {
  Experimental_Agent as Agent,
  stepCountIs,
  validateUIMessages,
  type Tool,
} from "ai";
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
    const agent = getAgentById(requestedAgentId);
    
    if (!agent) {
      console.error(`[workforce/agent] Agent not found: ${requestedAgentId}`);
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    console.log(`[workforce/agent] Loading agent: ${requestedAgentId}`);
    console.log(`[workforce/agent] Model: ${agent.model}, ToolIds: [${agent.toolIds.join(", ")}]`);
    console.log(`[workforce/agent] ConnectionToolBindings: ${agent.connectionToolBindings?.length || 0}`);

    // Build tool map dynamically from agent's toolIds (custom tools)
    const toolMap: Record<string, Tool<unknown, unknown>> = {};
    for (const toolId of agent.toolIds) {
      const toolDef = await getExecutableToolById(toolId);
      if (!toolDef) {
        console.warn(`[workforce/agent] Custom tool not found: ${toolId}; skipping.`);
        continue;
      }
      toolMap[toolId] = toolDef.run;
    }

    // Build tool map for connection tools
    const connectionBindings = agent.connectionToolBindings || [];
    for (const binding of connectionBindings) {
      const toolDef = await getConnectionToolExecutable(userId, binding);
      if (!toolDef) {
        console.warn(`[workforce/agent] Connection tool not found: ${binding.toolId}; skipping.`);
        continue;
      }
      // Use the tool ID as the key so the agent can call it
      toolMap[binding.toolId] = toolDef.run;
    }

    // Instantiate agent dynamically with registry config.
    const dynamicAgent = new Agent({
      model: agent.model,
      system: agent.systemPrompt,
      tools: toolMap,
      stopWhen: stepCountIs(agent.maxSteps ?? 3),
    });

    type AgentMessage = Parameters<typeof dynamicAgent.respond>[0]["messages"][number];
    const validated = await validateUIMessages<AgentMessage>({
      messages,
      tools: toolMap,
    });

    // Optionally prepend additional context as a system message.
    const augmented: AgentMessage[] = [
      ...(context
        ? ([
            {
              role: "system",
              parts: [
                {
                  type: "text",
                  text: `Additional context for this session:\n${context}`,
                },
              ],
            } as AgentMessage,
          ] as AgentMessage[])
        : []),
      ...validated,
    ];

    console.log("[workforce/agent] messages:", validated.length);
    console.log(`[workforce/agent] Tools available: ${Object.keys(toolMap).length > 0 ? Object.keys(toolMap).join(", ") : "none"}`);
    
    const response = await dynamicAgent.respond({ messages: augmented });
    console.log("[workforce/agent] response sent");
    return response;
  } catch (error) {
    console.error("[workforce/agent] error:", error);
    return NextResponse.json({ message: "Agent failed to respond." }, { status: 500 });
  }
}


