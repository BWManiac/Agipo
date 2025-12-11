/**
 * Phase 0 Spike: Test Endpoint
 *
 * Single endpoint with query params to test different integration points.
 *
 * Usage:
 *   POST /api/dox/spike/test?test=editor       - Test Lexical editor creation
 *   POST /api/dox/spike/test?test=markdown     - Test Markdown round-trip
 *   POST /api/dox/spike/test?test=blocks       - Test block manipulation
 *   POST /api/dox/spike/test?test=frontmatter  - Test frontmatter parsing
 *   POST /api/dox/spike/test?test=agent-tools  - Test agent tool patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { testEditorCreation } from "../services/test-lexical-markdown";
import { testMarkdownRoundTrip } from "../services/test-lexical-markdown";
import { testBlockManipulation } from "../services/test-blocks";
import { testFrontmatterParsing } from "../services/test-frontmatter";
import { testAgentToolPatterns } from "../services/test-agent-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const AVAILABLE_TESTS = [
  "editor",
  "markdown",
  "blocks",
  "frontmatter",
  "agent-tools",
] as const;
type TestType = (typeof AVAILABLE_TESTS)[number];

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get("test") as TestType | null;

  console.log(`[DOX Spike Test] Running test: ${testType}`);

  try {
    switch (testType) {
      case "editor":
        return NextResponse.json(await testEditorCreation());

      case "markdown":
        return NextResponse.json(await testMarkdownRoundTrip());

      case "blocks":
        return NextResponse.json(await testBlockManipulation());

      case "frontmatter":
        return NextResponse.json(await testFrontmatterParsing());

      case "agent-tools":
        return NextResponse.json(await testAgentToolPatterns());

      default:
        return NextResponse.json(
          {
            error: "Invalid or missing test type",
            availableTests: AVAILABLE_TESTS,
            usage: {
              editor: "POST /api/dox/spike/test?test=editor",
              markdown: "POST /api/dox/spike/test?test=markdown",
              blocks: "POST /api/dox/spike/test?test=blocks",
              frontmatter: "POST /api/dox/spike/test?test=frontmatter",
              "agent-tools": "POST /api/dox/spike/test?test=agent-tools",
            },
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[DOX Spike Test] Error:", error);

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
    message: "DOX Feature Spike Test Endpoint",
    method: "Use POST to run tests",
    availableTests: AVAILABLE_TESTS,
    usage: {
      editor: "POST /api/dox/spike/test?test=editor",
      markdown: "POST /api/dox/spike/test?test=markdown",
      blocks: "POST /api/dox/spike/test?test=blocks",
      frontmatter: "POST /api/dox/spike/test?test=frontmatter",
      "agent-tools": "POST /api/dox/spike/test?test=agent-tools",
    },
    curlExamples: {
      editor: 'curl -X POST "http://localhost:3000/api/dox/spike/test?test=editor"',
      markdown: 'curl -X POST "http://localhost:3000/api/dox/spike/test?test=markdown"',
      blocks: 'curl -X POST "http://localhost:3000/api/dox/spike/test?test=blocks"',
      frontmatter: 'curl -X POST "http://localhost:3000/api/dox/spike/test?test=frontmatter"',
      "agent-tools": 'curl -X POST "http://localhost:3000/api/dox/spike/test?test=agent-tools"',
    },
  });
}
