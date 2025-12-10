/**
 * Phase 0 Spike: Playwright Connection Test
 *
 * Tests Playwright CDP connection to Anchor Browser session.
 * Validates: AC-0.4, AC-0.5, AC-0.6
 */

import { chromium, Browser } from "playwright";
import { testSessionCreation, terminateSession } from "./test-session";

export interface PlaywrightTestResult {
  success: boolean;
  sessionId: string;
  liveViewUrl: string;
  cdpConnection: string;
  navigation: {
    targetUrl: string;
    currentUrl: string;
    pageTitle: string;
  };
  note: string;
}

export async function testPlaywrightConnection(): Promise<PlaywrightTestResult> {
  // Create session first
  const sessionResult = await testSessionCreation();
  const { id: sessionId, cdpUrl, liveViewUrl } = sessionResult.session;

  let browser: Browser | null = null;

  try {
    // Connect Playwright via CDP
    browser = await chromium.connectOverCDP(cdpUrl, {
      timeout: 30000,
    });

    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // Test navigation
    await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    const pageTitle = await page.title();

    return {
      success: true,
      sessionId,
      liveViewUrl,
      cdpConnection: "success",
      navigation: {
        targetUrl: "https://example.com",
        currentUrl,
        pageTitle,
      },
      note: "Playwright connected and navigated successfully. Open liveViewUrl to see the browser.",
    };
  } finally {
    // Cleanup: Disconnect Playwright (don't close Anchor's browser)
    if (browser) {
      await browser.close();
    }
    // Note: Session will auto-terminate based on timeout settings
    // For testing, you can manually terminate via: terminateSession(sessionId)
  }
}
