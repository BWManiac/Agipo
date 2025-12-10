/**
 * Phase 0 Spike: Test Endpoint
 *
 * Single endpoint with query params to test different integration points.
 *
 * Usage:
 *   POST /api/browser-automation/spike/test?test=session     - Test session creation
 *   POST /api/browser-automation/spike/test?test=playwright  - Test Playwright CDP connection
 *   POST /api/browser-automation/spike/test?test=actions     - Test basic browser actions
 *   POST /api/browser-automation/spike/test?test=agent       - Test Mastra agent integration
 *   POST /api/browser-automation/spike/test?test=full        - Test full end-to-end flow
 */

import { NextRequest, NextResponse } from "next/server";
import { testSessionCreation, terminateSession } from "../services/test-session";
import { testPlaywrightConnection } from "../services/test-playwright";
import { testBasicActions } from "../services/test-actions";
import { testAgentIntegration } from "../services/test-agent";
import { testFullFlow } from "../services/test-full";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes max for browser operations

const AVAILABLE_TESTS = ["session", "playwright", "actions", "agent", "full", "terminate"] as const;
type TestType = (typeof AVAILABLE_TESTS)[number];

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get("test") as TestType | null;
  const sessionId = searchParams.get("sessionId"); // For terminate

  console.log(`[Spike Test] Running test: ${testType}`);

  try {
    switch (testType) {
      case "session":
        return NextResponse.json(await testSessionCreation());

      case "playwright":
        return NextResponse.json(await testPlaywrightConnection());

      case "actions":
        return NextResponse.json(await testBasicActions());

      case "agent":
        return NextResponse.json(await testAgentIntegration());

      case "full":
        return NextResponse.json(await testFullFlow());

      case "terminate":
        if (!sessionId) {
          return NextResponse.json(
            { error: "sessionId query param required for terminate" },
            { status: 400 }
          );
        }
        await terminateSession(sessionId);
        return NextResponse.json({
          success: true,
          message: `Session ${sessionId} terminated`,
        });

      default:
        return NextResponse.json(
          {
            error: "Invalid or missing test type",
            availableTests: AVAILABLE_TESTS,
            usage: {
              session: "POST /api/browser-automation/spike/test?test=session",
              playwright: "POST /api/browser-automation/spike/test?test=playwright",
              actions: "POST /api/browser-automation/spike/test?test=actions",
              agent: "POST /api/browser-automation/spike/test?test=agent",
              full: "POST /api/browser-automation/spike/test?test=full",
              terminate: "POST /api/browser-automation/spike/test?test=terminate&sessionId=sess_xxx",
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Spike Test] Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.stack
        : undefined;

    return NextResponse.json(
      {
        error: "Test failed",
        testType,
        message: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}

// GET handler for easy browser testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Browser Automation Spike Test Endpoint",
    method: "Use POST to run tests",
    availableTests: AVAILABLE_TESTS,
    usage: {
      session: "POST /api/browser-automation/spike/test?test=session",
      playwright: "POST /api/browser-automation/spike/test?test=playwright",
      actions: "POST /api/browser-automation/spike/test?test=actions",
      agent: "POST /api/browser-automation/spike/test?test=agent",
      full: "POST /api/browser-automation/spike/test?test=full",
      terminate: "POST /api/browser-automation/spike/test?test=terminate&sessionId=sess_xxx",
    },
    curlExamples: {
      session: 'curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=session"',
      playwright: 'curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=playwright"',
      actions: 'curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=actions"',
      agent: 'curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=agent"',
      full: 'curl -X POST "http://localhost:3000/api/browser-automation/spike/test?test=full"',
    },
  });
}
