/**
 * GET /api/workflows/composio-schemas/all
 * 
 * Returns ALL toolkits with ALL tools (names/descriptions only, no full schemas).
 * Used by Tools Panel to load all tools in one request.
 */

import { NextResponse } from "next/server";
import { readCacheMeta, listCachedToolkits, readToolkitCache } from "../services/composio-schema-cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const meta = await readCacheMeta();
    const toolkitSlugs = await listCachedToolkits();

    // Read all toolkits
    const toolkits = await Promise.all(
      toolkitSlugs.map(async (slug) => {
        const toolkit = await readToolkitCache(slug);
        if (!toolkit) return null;
        return {
          slug: toolkit.slug,
          name: toolkit.name,
          logo: toolkit.logo,
          tools: toolkit.tools.map((tool) => ({
            slug: tool.slug,
            name: tool.name,
            description: tool.description || "",
          })),
        };
      })
    );

    const validToolkits = toolkits.filter(
      (t): t is NonNullable<typeof t> => t !== null
    );

    return NextResponse.json({
      lastSyncedAt: meta?.lastSyncedAt || null,
      toolkits: validToolkits,
    });
  } catch (error) {
    console.error("[schemas/all] Error:", error);
    return NextResponse.json(
      {
        lastSyncedAt: null,
        toolkits: [],
        error: error instanceof Error ? error.message : "Failed to read schemas",
      },
      { status: 500 }
    );
  }
}

