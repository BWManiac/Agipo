/**
 * GET /api/workflows/composio-schemas/[toolkit]/[tool]
 * 
 * Returns a single tool with full input/output schemas.
 * Used when configuring a step in the workflow editor.
 */

import { NextResponse } from "next/server";
import { readToolkitCache } from "../../services/composio-schema-cache";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolkit: string; tool: string }> }
) {
  try {
    const { toolkit: toolkitSlug, tool: toolSlug } = await params;

    const toolkit = await readToolkitCache(toolkitSlug);

    if (!toolkit) {
      return NextResponse.json(
        { error: `Toolkit ${toolkitSlug} not found in cache` },
        { status: 404 }
      );
    }

    const tool = toolkit.tools.find((t) => t.slug === toolSlug);

    if (!tool) {
      return NextResponse.json(
        { error: `Tool ${toolSlug} not found in ${toolkitSlug}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      toolkitSlug: toolkit.slug,
      inputParameters: tool.inputParameters || {},
      outputParameters: tool.outputParameters || {      },
    });
  } catch (error) {
    let toolkitSlug = "unknown";
    let toolSlug = "unknown";
    try {
      const resolved = await params;
      toolkitSlug = resolved.toolkit;
      toolSlug = resolved.tool;
    } catch {
      // params already resolved or failed
    }
    console.error(`[schemas/${toolkitSlug}/${toolSlug}] Error:`, error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read tool",
      },
      { status: 500 }
    );
  }
}

