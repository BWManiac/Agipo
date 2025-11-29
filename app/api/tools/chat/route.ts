/**
 * Agent Route (`/api/agent`)
 *
 * Responsibilities:
 * - Instantiate the Workflow Generator agent with Gemini 2.5 Flash through the
 *   Vercel AI Gateway.
 * - Accept UI messages from the chat client, validate them against the tool set,
 *   and prepend the latest workflow context as a system message (provided via
 *   the request body by `ChatPanel`).
 * - Stream the agent’s response back in AI SDK UI format so the client can
 *   render assistant text, tool calls, and tool outputs incrementally.
 *
 * We keep this module lean—no Zustand access or mutation logic—so it can scale
 * with future transports or model changes.
 */
import {
  Experimental_Agent as Agent,
  stepCountIs,
  validateUIMessages,
  type Tool,
} from "ai";

import { workflowTools } from "@/app/(pages)/workflow-generator/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

// Debug: log if the key is available (first 10 chars only for safety)
console.log("🔑 AI_GATEWAY_API_KEY present?", !!process.env.AI_GATEWAY_API_KEY);
if (process.env.AI_GATEWAY_API_KEY) {
  console.log("🔑 Key prefix:", process.env.AI_GATEWAY_API_KEY.substring(0, 10) + "...");
}

const chatAgent = new Agent({
  // Gemini 2.5 Flash via AI Gateway (https://vercel.com/ai-gateway/models/gemini-2.5-flash)
  model: "google/gemini-2.5-pro",
  system:
    "You are the Workflow Generator assistant. Answer succinctly. Do not attempt to change the canvas directly; you will later call tools to propose edits.",
  tools: workflowTools,
  stopWhen: stepCountIs(10), // Allow multi-step reasoning
});

export async function POST(request: Request) {
  try {
    // The client attaches `workflowContext` alongside UI messages so we can
    // inject it server-side without exposing it in the chat UI.
    const { messages, workflowContext } = await request.json();
    console.log("📨 Received", messages.length, "messages");

    // Validate UI messages from client; cast to broad type to satisfy agent generics.
    const toolValidationMap = workflowTools as unknown as Record<
      string,
      Tool<unknown, unknown>
    >;
    type AgentMessage = Parameters<
      typeof chatAgent.respond
    >[0]["messages"][number];
    const validated = await validateUIMessages<AgentMessage>({
      messages,
      tools: toolValidationMap,
    });

    // Stream a UI-friendly response compatible with @ai-sdk/react useChat
    const augmentedMessages: AgentMessage[] = [
      ...(workflowContext
        ? [
          // System message must remain at the very start to satisfy Gemini’s
          // “system-first” constraint. We only add it when context is present.
          {
            role: "system",
            parts: [
              {
                type: "text",
                text: `Current workflow state:\n${workflowContext}`,
              },
            ],
          } as AgentMessage,
        ]
        : []),
      ...validated,
    ];

    const response = await chatAgent.respond({
      messages: augmentedMessages,
    });
    console.log("✅ Agent response generated");
    return response;
  } catch (error) {
    console.error("❌ Agent route error:", error);
    throw error;
  }
}


