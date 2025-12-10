// Document Agent Configuration

import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { createDocTools } from "./doc-tools";

export function createDocAgent(docId: string): Agent {
  const tools = createDocTools(docId);

  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const agent = new Agent({
    name: "Document Assistant",
    instructions: `You are a helpful document editing assistant. You can read, modify, and update documents based on user requests.

When the user asks you to make changes to the document:
1. First read the relevant section if needed
2. Make the requested changes using the appropriate tool
3. Confirm what changes were made

Be concise but helpful. When inserting or replacing content, format it appropriately with Markdown.`,
    model: gateway("anthropic/claude-sonnet-4-20250514"),
    tools,
  });

  return agent;
}

export function getDocTools(docId: string) {
  return createDocTools(docId);
}
