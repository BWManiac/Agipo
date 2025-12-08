/**
 * Chat Service
 * 
 * Business logic for agent chat, including tool building and message formatting.
 */

import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import type { Tool } from "ai";
import type { AgentConfig } from "@/_tables/types";
import { getAgentById } from "@/_tables/agents";
import { getExecutableToolById, getConnectionToolExecutable } from "@/app/api/tools/services";
import { getWorkflowToolExecutable } from "@/app/api/tools/services/workflow-tools";
import { getAgentMemory } from "./memory";

// ============================================================================
// Types
// ============================================================================

/** Incoming message format from frontend */
export type IncomingMessage = {
  id?: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

/** Formatted message for Mastra agent */
export type FormattedMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// ============================================================================
// Agent Loading
// ============================================================================

/**
 * Loads an agent config by ID.
 * @param agentId - The agent ID (defaults to "pm" if not provided)
 * @returns The agent config or null if not found
 */
export function loadAgentConfig(agentId: string | undefined): AgentConfig | null {
  const requestedId = agentId ?? "pm";
  const config = getAgentById(requestedId);
  
  if (!config) {
    console.error(`[ChatService] Agent not found: ${requestedId}`);
    return null;
  }
  
  console.log(`[ChatService] Loading agent: ${requestedId}`);
  console.log(`[ChatService] Model: ${config.model}, ToolIds: [${config.toolIds.join(", ")}]`);
  console.log(`[ChatService] ConnectionToolBindings: ${config.connectionToolBindings?.length || 0}`);
  
  return config;
}

// ============================================================================
// Tool Building
// ============================================================================

/**
 * Builds a tool map for an agent, combining custom tools and connection tools.
 * 
 * @param userId - The authenticated user's ID (for connection tools)
 * @param agentConfig - The agent configuration
 * @returns A map of tool IDs to executable tools
 */
export async function buildToolMap(
  userId: string,
  agentConfig: AgentConfig
): Promise<Record<string, Tool<unknown, unknown>>> {
  const toolMap: Record<string, Tool<unknown, unknown>> = {};
  
  // Load custom tools
  for (const toolId of agentConfig.toolIds) {
    const toolDef = await getExecutableToolById(toolId);
    if (!toolDef) {
      console.warn(`[ChatService] Custom tool not found: ${toolId}; skipping.`);
      continue;
    }
    toolMap[toolId] = toolDef.run;
  }

  // Load connection tools
  const connectionBindings = agentConfig.connectionToolBindings || [];
  for (const binding of connectionBindings) {
    const toolDef = await getConnectionToolExecutable(userId, binding);
    if (!toolDef) {
      console.warn(`[ChatService] Connection tool not found: ${binding.toolId}; skipping.`);
      continue;
    }
    toolMap[binding.toolId] = toolDef.run;
  }

  // Load workflow tools
  const workflowBindings = agentConfig.workflowBindings || [];
  for (const binding of workflowBindings) {
    const toolDef = await getWorkflowToolExecutable(userId, binding);
    if (!toolDef) {
      console.warn(`[ChatService] Workflow tool not found: ${binding.workflowId}; skipping.`);
      continue;
    }
    // Extract .run property (same pattern as connection tools)
    toolMap[toolDef.id] = toolDef.run;
    console.log(`[ChatService] Loaded workflow tool: ${toolDef.id}`);
  }
  
  console.log(`[ChatService] Loaded ${Object.keys(toolMap).length} tools: ${Object.keys(toolMap).join(", ") || "none"}`);
  
  return toolMap;
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Formats incoming messages for Mastra agent.
 * Handles both content string and parts array format.
 * 
 * @param messages - Raw messages from frontend
 * @param context - Optional additional context to prepend
 * @returns Formatted messages array
 */
export function formatMessages(
  messages: IncomingMessage[],
  context?: string
): FormattedMessage[] {
  const formattedMessages: FormattedMessage[] = [];

  // Add context as system message if provided
  if (context) {
    formattedMessages.push({
      role: "system",
      content: `Additional context for this session:\n${context}`,
    });
  }

  // Convert incoming messages to simple role/content format
  for (const msg of messages) {
    let content = "";
    
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

  console.log(`[ChatService] Formatted ${formattedMessages.length} messages`);
  
  return formattedMessages;
}

// ============================================================================
// Agent Creation
// ============================================================================

/**
 * Creates a fully configured Mastra agent ready for streaming.
 * 
 * @param userId - The authenticated user's ID
 * @param agentConfig - The agent configuration
 * @param toolMap - Pre-built tool map
 * @returns Configured Mastra Agent instance
 */
export function createConfiguredAgent(
  userId: string,
  agentConfig: AgentConfig,
  toolMap: Record<string, Tool<unknown, unknown>>
): Agent {
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  return new Agent({
    name: agentConfig.id,
    instructions: agentConfig.systemPrompt,
    model: gateway(agentConfig.model),
    tools: toolMap,
    memory: getAgentMemory(agentConfig.id),
  });
}

