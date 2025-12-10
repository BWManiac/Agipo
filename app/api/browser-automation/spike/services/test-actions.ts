/**
 * Phase 0 Spike: Basic Browser Actions Test
 *
 * Tests Playwright browser actions (navigate, click, type).
 * Validates: AC-0.5, AC-0.6
 */

import { chromium, Browser } from "playwright";
import { testSessionCreation } from "./test-session";

export interface ActionResult {
  action: string;
  target?: string;
  success: boolean;
  duration: number;
  error?: string;
}

export interface ActionsTestResult {
  success: boolean;
  sessionId: string;
  liveViewUrl: string;
  actions: ActionResult[];
  finalUrl: string;
  note: string;
}

export async function testBasicActions(): Promise<ActionsTestResult> {
  const sessionResult = await testSessionCreation();
  const { id: sessionId, cdpUrl, liveViewUrl } = sessionResult.session;

  let browser: Browser | null = null;
  const actions: ActionResult[] = [];

  try {
    browser = await chromium.connectOverCDP(cdpUrl, { timeout: 30000 });
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // Action 1: Navigate
    let start = Date.now();
    try {
      await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
      actions.push({
        action: "navigate",
        target: "https://www.google.com",
        success: true,
        duration: Date.now() - start,
      });
    } catch (error) {
      actions.push({
        action: "navigate",
        target: "https://www.google.com",
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    // Wait for page to be ready
    await page.waitForLoadState("networkidle");

    // Action 2: Click search input
    start = Date.now();
    try {
      // Google's search box selector
      await page.click('textarea[name="q"], input[name="q"]', { timeout: 5000 });
      actions.push({
        action: "click",
        target: 'textarea[name="q"]',
        success: true,
        duration: Date.now() - start,
      });
    } catch (error) {
      actions.push({
        action: "click",
        target: 'textarea[name="q"]',
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    // Action 3: Type search query
    start = Date.now();
    try {
      await page.fill('textarea[name="q"], input[name="q"]', "browser automation test");
      actions.push({
        action: "type",
        target: "browser automation test",
        success: true,
        duration: Date.now() - start,
      });
    } catch (error) {
      actions.push({
        action: "type",
        target: "browser automation test",
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    // Action 4: Press Enter to search
    start = Date.now();
    try {
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 });
      actions.push({
        action: "submit",
        target: "Enter key",
        success: true,
        duration: Date.now() - start,
      });
    } catch (error) {
      actions.push({
        action: "submit",
        target: "Enter key",
        success: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Don't throw - search might still work even if navigation event not detected
    }

    const finalUrl = page.url();

    return {
      success: actions.every((a) => a.success),
      sessionId,
      liveViewUrl,
      actions,
      finalUrl,
      note: "Basic actions test completed. Check liveViewUrl to see browser state.",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
