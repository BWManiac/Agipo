/**
 * GET /api/workflows/composio-schemas
 * 
 * Returns a summary list of all cached toolkits (no tools, just counts).
 */

import { NextResponse } from "next/server";
import { readCacheMeta, listCachedToolkits, readToolkitCache } from "./services/composio-schema-cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const meta = await readCacheMeta();
    const toolkitSlugs = await listCachedToolkits();

    // Read each toolkit to get summary info
    const toolkits = await Promise.all(
      toolkitSlugs.map(async (slug) => {
        const toolkit = await readToolkitCache(slug);
        if (!toolkit) return null;
        return {
          slug: toolkit.slug,
          name: toolkit.name,
          logo: toolkit.logo,
          toolCount: toolkit.toolCount,
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
    console.error("[schemas] Error:", error);
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

