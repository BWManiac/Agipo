/**
 * Document Agent
 * 
 * Mastra agent configuration for document editing.
 */

import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { loadAgentConfig, buildToolMap, createConfiguredAgent } from "@/app/api/workforce/[agentId]/chat/services/chat-service";
import { buildDocumentTools } from "./document-tools";

/**
 * Create a configured Mastra agent for document editing.
 */
export async function createDocumentAgent(
  userId: string,
  agentId: string,
  docId: string
): Promise<Agent> {
  // Load agent config
  const agentConfig = loadAgentConfig(agentId);
  if (!agentConfig) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Build document tools
  const documentTools = buildDocumentTools(docId);

  // Build other tools (custom, connection, workflow)
  const otherTools = await buildToolMap(userId, agentConfig);

  // Create agent with all tools (document tools + other tools)
  const agent = createConfiguredAgent(userId, agentConfig, {
    ...otherTools,
    ...documentTools,
  });

  return agent;
}
