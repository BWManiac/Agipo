/**
 * Phase 0 Spike: Mastra Agent Integration Test
 *
 * Tests Mastra agent with browser tools.
 * Validates: AC-0.7, AC-0.8, AC-0.9, AC-0.10
 */

import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { tool } from "ai";
import { z } from "zod";
import { chromium, Browser, Page } from "playwright";
import { testSessionCreation } from "./test-session";

export interface AgentTestResult {
  success: boolean;
  sessionId: string;
  liveViewUrl: string;
  agentCreated: boolean;
  testMessage: string;
  agentResponse: string;
  toolsCalled: string[];
  navigation: {
    success: boolean;
    finalUrl: string;
  };
  streamingWorked: boolean;
  note: string;
}

/**
 * Creates browser control tools for the agent.
 */
function createBrowserTools(page: Page) {
  const toolsCalled: string[] = [];

  const navigateTool = tool({
    description: "Navigate the browser to a URL",
    inputSchema: z.object({
      url: z.string().describe("The URL to navigate to"),
    }),
    async execute({ url }) {
      toolsCalled.push("navigate");
      // Add protocol if missing
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
      return {
        success: true,
        url: page.url(),
        title: await page.title(),
      };
    },
  });

  const clickTool = tool({
    description: "Click an element on the page by CSS selector or visible text",
    inputSchema: z.object({
      selector: z
        .string()
        .describe("CSS selector or text to find and click"),
    }),
    async execute({ selector }) {
      toolsCalled.push("click");
      try {
        // Try as CSS selector first
        await page.click(selector, { timeout: 5000 });
      } catch {
        // Try as text
        await page.getByText(selector).click({ timeout: 5000 });
      }
      return { success: true, clicked: selector };
    },
  });

  const typeTool = tool({
    description: "Type text into an input field",
    inputSchema: z.object({
      selector: z.string().describe("CSS selector of the input field"),
      text: z.string().describe("Text to type"),
    }),
    async execute({ selector, text }) {
      toolsCalled.push("type");
      await page.fill(selector, text);
      return { success: true, typed: text.length };
    },
  });

  return { navigateTool, clickTool, typeTool, toolsCalled };
}

export async function testAgentIntegration(): Promise<AgentTestResult> {
  // Create session and connect Playwright
  const sessionResult = await testSessionCreation();
  const { id: sessionId, cdpUrl, liveViewUrl } = sessionResult.session;

  let browser: Browser | null = null;

  try {
    browser = await chromium.connectOverCDP(cdpUrl, { timeout: 30000 });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // Create browser tools
    const { navigateTool, clickTool, typeTool, toolsCalled } =
      createBrowserTools(page);

    // Create Mastra agent with browser tools
    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    const agent = new Agent({
      name: "browser-control-spike",
      instructions: `You control a browser. Execute user instructions by calling browser tools.

Available tools:
- navigate: Go to a URL
- click: Click an element
- type: Type text into an input

Always confirm what you're doing before taking action.
When asked to navigate somewhere, use the navigate tool with the full URL.`,
      model: gateway("anthropic/claude-sonnet-4-20250514"),
      tools: {
        navigate: navigateTool,
        click: clickTool,
        type: typeTool,
      },
    });

    // Test agent with simple command
    const testMessage = "Navigate to example.com";
    const response = await agent.stream(testMessage);

    // Collect response chunks to test streaming
    const chunks: string[] = [];
    let chunkCount = 0;

    for await (const chunk of response.textStream) {
      chunks.push(chunk);
      chunkCount++;
    }

    const fullResponse = chunks.join("");
    const streamingWorked = chunkCount > 1; // Multiple chunks means streaming worked

    // Verify navigation happened
    const finalUrl = page.url();
    const navigationSuccess = finalUrl.includes("example.com");

    return {
      success: navigationSuccess && toolsCalled.includes("navigate"),
      sessionId,
      liveViewUrl,
      agentCreated: true,
      testMessage,
      agentResponse: fullResponse,
      toolsCalled,
      navigation: {
        success: navigationSuccess,
        finalUrl,
      },
      streamingWorked,
      note: `Agent created and executed ${toolsCalled.length} tool(s). Streaming: ${streamingWorked ? "working" : "single chunk"}. Check liveViewUrl to see browser.`,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
