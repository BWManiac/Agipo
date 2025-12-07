import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const ChatRequestSchema = z.object({
  message: z.string().min(1),
  workflowContext: z.object({
    id: z.string(),
    name: z.string(),
    steps: z.array(z.any()),
    mappings: z.array(z.any()),
  }),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

const SYSTEM_PROMPT = `You are an AI assistant helping users build workflow automations. You have access to Composio tools and can help users:

1. Understand what their workflow should do
2. Suggest appropriate tools and steps
3. Explain how to connect steps with data mappings
4. Troubleshoot issues with their workflow

When users describe what they want to automate, respond with:
- Clear step-by-step guidance
- Specific tool recommendations from Composio (e.g., GMAIL_SEND, FIRECRAWL_SCRAPE, GITHUB_CREATE_ISSUE)
- Explanations of how data flows between steps

Keep responses concise and actionable. Focus on the immediate next step the user should take.

Current workflow context:
- Name: {{workflowName}}
- Current steps: {{stepCount}}
- Steps: {{stepList}}

Available Composio toolkits: firecrawl, gmail, github, slack, notion, linear, twitter, browser_tool`;

/**
 * POST /api/workflows-d/chat
 * AI-powered chat for workflow building assistance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ChatRequestSchema.parse(body);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { message: "AI service not configured" },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Build context-aware system prompt
    const systemPrompt = SYSTEM_PROMPT
      .replace("{{workflowName}}", validated.workflowContext.name)
      .replace("{{stepCount}}", validated.workflowContext.steps.length.toString())
      .replace("{{stepList}}", validated.workflowContext.steps.map((s: { name: string }, i: number) => `${i + 1}. ${s.name}`).join(", ") || "None");

    // Build messages array
    const messages: Anthropic.MessageParam[] = [];
    
    // Add conversation history
    if (validated.conversationHistory) {
      for (const msg of validated.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
    
    // Add current message
    messages.push({
      role: "user",
      content: validated.message,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === "text");
    const assistantMessage = textContent?.type === "text" ? textContent.text : "I apologize, I couldn't generate a response.";

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("API Error: Chat failed:", error);
    return NextResponse.json(
      { message: "Failed to process chat request" },
      { status: 500 }
    );
  }
}


