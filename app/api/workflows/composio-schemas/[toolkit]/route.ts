/**
 * GET /api/workflows/composio-schemas/[toolkit]
 * 
 * Returns all tools for a specific toolkit with full schemas.
 */

import { NextResponse } from "next/server";
import { readToolkitCache } from "../services/composio-schema-cache";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolkit: string }> }
) {
  try {
    const { toolkit: toolkitSlug } = await params;
    const toolkit = await readToolkitCache(toolkitSlug);

    if (!toolkit) {
      return NextResponse.json(
        { error: `Toolkit ${toolkitSlug} not found in cache` },
        { status: 404 }
      );
    }

    return NextResponse.json(toolkit);
  } catch (error) {
    let toolkitSlug = "unknown";
    try {
      const resolved = await params;
      toolkitSlug = resolved.toolkit;
    } catch {
      // params already resolved or failed
    }
    console.error(`[schemas/${toolkitSlug}] Error:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to read toolkit",
      },
      { status: 500 }
    );
  }
}

