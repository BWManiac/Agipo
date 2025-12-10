/**
 * Phase 0 Spike: Full End-to-End Flow Test
 *
 * Tests complete flow: session → Playwright → agent → multi-step actions.
 * Validates: AC-0.11, AC-0.12
 */

import { Agent } from "@mastra/core/agent";
import { createGateway } from "@ai-sdk/gateway";
import { tool } from "ai";
import { z } from "zod";
import { chromium, Browser, Page } from "playwright";
import { testSessionCreation } from "./test-session";

export interface FullFlowAction {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: string;
}

export interface FullFlowResult {
  success: boolean;
  sessionId: string;
  liveViewUrl: string;
  steps: {
    sessionCreation: boolean;
    playwrightConnection: boolean;
    agentCreation: boolean;
    commandExecution: boolean;
  };
  command: string;
  agentResponse: string;
  actionsExecuted: FullFlowAction[];
  finalUrl: string;
  streamChunkCount: number;
  note: string;
}

/**
 * Creates browser tools that log their executions.
 */
function createLoggingBrowserTools(page: Page) {
  const actionsExecuted: FullFlowAction[] = [];

  const navigate = tool({
    description: "Navigate the browser to a URL",
    inputSchema: z.object({
      url: z.string().describe("The URL to navigate to"),
    }),
    async execute({ url }) {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
      const result = {
        success: true,
        url: page.url(),
        title: await page.title(),
      };
      actionsExecuted.push({
        tool: "navigate",
        args: { url },
        result,
        timestamp: new Date().toISOString(),
      });
      return result;
    },
  });

  const click = tool({
    description: "Click an element on the page",
    inputSchema: z.object({
      selector: z.string().describe("CSS selector or text to click"),
    }),
    async execute({ selector }) {
      try {
        // Try CSS selector first
        await page.click(selector, { timeout: 5000 });
      } catch {
        // Fall back to text-based selection
        await page.getByText(selector, { exact: false }).first().click({ timeout: 5000 });
      }
      const result = { success: true, clicked: selector };
      actionsExecuted.push({
        tool: "click",
        args: { selector },
        result,
        timestamp: new Date().toISOString(),
      });
      return result;
    },
  });

  const type = tool({
    description: "Type text into an input field",
    inputSchema: z.object({
      selector: z.string().describe("CSS selector of the input"),
      text: z.string().describe("Text to type"),
    }),
    async execute({ selector, text }) {
      await page.fill(selector, text);
      const result = { success: true, typed: text.length };
      actionsExecuted.push({
        tool: "type",
        args: { selector, text },
        result,
        timestamp: new Date().toISOString(),
      });
      return result;
    },
  });

  const screenshot = tool({
    description: "Take a screenshot of the current page",
    inputSchema: z.object({
      fullPage: z.boolean().optional().describe("Capture full page"),
    }),
    async execute({ fullPage = false }) {
      const buffer = await page.screenshot({ fullPage });
      const base64 = buffer.toString("base64").substring(0, 100) + "..."; // Truncate for response
      const result = { success: true, size: buffer.length, preview: base64 };
      actionsExecuted.push({
        tool: "screenshot",
        args: { fullPage },
        result: { success: true, size: buffer.length },
        timestamp: new Date().toISOString(),
      });
      return result;
    },
  });

  const extract = tool({
    description: "Extract text content from the page or specific element",
    inputSchema: z.object({
      selector: z
        .string()
        .optional()
        .describe("CSS selector (omit for page text)"),
    }),
    async execute({ selector }) {
      let text: string;
      if (selector) {
        text = await page.locator(selector).textContent() || "";
      } else {
        text = await page.evaluate(() => document.body.innerText);
      }
      // Truncate long text
      const truncated = text.length > 500 ? text.substring(0, 500) + "..." : text;
      const result = { success: true, text: truncated, length: text.length };
      actionsExecuted.push({
        tool: "extract",
        args: { selector },
        result: { success: true, length: text.length },
        timestamp: new Date().toISOString(),
      });
      return result;
    },
  });

  return { tools: { navigate, click, type, screenshot, extract }, actionsExecuted };
}

export async function testFullFlow(): Promise<FullFlowResult> {
  const steps = {
    sessionCreation: false,
    playwrightConnection: false,
    agentCreation: false,
    commandExecution: false,
  };

  // Step 1: Create session
  const sessionResult = await testSessionCreation();
  const { id: sessionId, cdpUrl, liveViewUrl } = sessionResult.session;
  steps.sessionCreation = true;

  let browser: Browser | null = null;

  try {
    // Step 2: Connect Playwright
    browser = await chromium.connectOverCDP(cdpUrl, { timeout: 30000 });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());
    steps.playwrightConnection = true;

    // Step 3: Create browser tools and agent
    const { tools, actionsExecuted } = createLoggingBrowserTools(page);

    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    const agent = new Agent({
      name: "browser-control-full",
      instructions: `You control a browser. Execute user instructions by calling browser tools.

Available tools:
- navigate: Go to a URL (add https:// if needed)
- click: Click an element by CSS selector or visible text
- type: Type text into an input field by selector
- screenshot: Take a screenshot
- extract: Extract text from page or element

Guidelines:
1. Always explain what you're about to do
2. Execute the necessary browser actions to complete the task
3. Confirm the result after each action
4. For multi-step tasks, execute each step in sequence`,
      model: gateway("anthropic/claude-sonnet-4-20250514"),
      tools,
    });
    steps.agentCreation = true;

    // Step 4: Execute multi-step command
    const command =
      "Go to google.com, click on the search box, and type 'browser automation testing'";

    const response = await agent.stream(command);

    // Collect streaming response
    const chunks: string[] = [];
    for await (const chunk of response.textStream) {
      chunks.push(chunk);
    }

    steps.commandExecution = actionsExecuted.length > 0;

    const finalUrl = page.url();

    return {
      success: Object.values(steps).every(Boolean),
      sessionId,
      liveViewUrl,
      steps,
      command,
      agentResponse: chunks.join(""),
      actionsExecuted,
      finalUrl,
      streamChunkCount: chunks.length,
      note: `Full flow completed. ${actionsExecuted.length} actions executed. Check liveViewUrl to see final browser state.`,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
