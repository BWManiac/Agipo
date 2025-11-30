import {
  streamText,
  convertToCoreMessages,
} from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { getExecutableTools } from "@/app/api/tools/services/runtime";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const tools = await getExecutableTools();
  const toolMap: Record<string, any> = {};
  tools.forEach((t) => {
    toolMap[t.id] = t.run;
  });

  // Use Vercel AI Gateway
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const result = await streamText({
    model: gateway("google/gemini-1.5-pro"), // Gateway model ID
    messages: convertToCoreMessages(messages),
    tools: toolMap,
  });

  return result.toTextStreamResponse();
}
