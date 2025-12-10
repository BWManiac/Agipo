/**
 * POST /api/connections/schemas/composio/sync
 * 
 * Triggers a full sync of all Composio tool schemas to local cache.
 * Includes both authenticated toolkits AND NO_AUTH platform toolkits (like browser_tool).
 * This is a manual operation (admin/dev trigger).
 */

import { NextResponse } from "next/server";
import { getComposioClient } from "@/app/api/connections/services/client";
import { listAuthConfigs } from "@/app/api/connections/services/composio";
import {
  writeCacheMeta,
  writeToolkitCache,
} from "../services/composio-schema-cache";
import type { CachedToolkit, CachedToolSchema } from "@/app/api/workflows/types/composio-schemas";

export const runtime = "nodejs";

/** NO_AUTH toolkit slugs that work without user authentication */
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

export async function POST() {
  const startTime = Date.now();

  try {
    const client = getComposioClient();

    // Get all available toolkits via auth configs
    const authConfigs = await listAuthConfigs();
    if (!authConfigs?.items?.length) {
      return NextResponse.json(
        { success: false, message: "No toolkits found" },
        { status: 500 }
      );
    }

    // Deduplicate by toolkit slug
    const seenSlugs = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueConfigs = authConfigs.items.filter((config: any) => {
      const slug = config.toolkit?.slug || config.appId || "";
      if (!slug || seenSlugs.has(slug)) return false;
      seenSlugs.add(slug);
      return true;
    });

    let totalToolCount = 0;
    const toolkitSlugs: string[] = [];

    // Fetch and cache each toolkit
    for (const config of uniqueConfigs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolkitSlug = (config as any).toolkit?.slug || (config as any).appId || "";
      if (!toolkitSlug) continue;

      try {
        // Get toolkit details
        const toolkit = await client.toolkits.get(toolkitSlug);

        // Get all tools for this toolkit
        const tools = await client.tools.getRawComposioTools({
          toolkits: [toolkitSlug],
          limit: 1000,
        });

        if (!tools || tools.length === 0) {
          console.warn(`[schema-sync] No tools found for ${toolkitSlug}`);
          continue;
        }

        // Map to CachedToolSchema format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cachedTools: CachedToolSchema[] = (tools as any[]).map(
          (tool: any) => ({
            slug: tool.slug || tool.name || "",
            name: tool.displayName || tool.name || "",
            description: tool.description || "",
            inputParameters: tool.inputParameters || tool.parameters?.properties || {},
            outputParameters: tool.outputParameters || {},
            toolkitSlug,
          })
        );

        // Create CachedToolkit
        const cachedToolkit: CachedToolkit = {
          slug: toolkitSlug,
          name: toolkit.name || toolkitSlug,
          logo: toolkit.meta?.logo || null,
          tools: cachedTools,
          toolCount: cachedTools.length,
        };

        // Write to cache
        await writeToolkitCache(cachedToolkit);

        totalToolCount += cachedTools.length;
        toolkitSlugs.push(toolkitSlug);

        console.log(
          `[schema-sync] Cached ${toolkitSlug}: ${cachedTools.length} tools`
        );
      } catch (error) {
        console.error(
          `[schema-sync] Failed to sync ${toolkitSlug}:`,
          error instanceof Error ? error.message : error
        );
        // Continue with other toolkits
      }
    }

    // =========================================================================
    // Sync NO_AUTH platform toolkits (e.g., browser_tool)
    // These don't appear in auth configs but are available to all users
    // =========================================================================
    for (const toolkitSlug of NO_AUTH_TOOLKIT_SLUGS) {
      // Skip if already synced via auth configs
      if (seenSlugs.has(toolkitSlug)) continue;

      try {
        // Get toolkit details
        const toolkit = await client.toolkits.get(toolkitSlug);

        // Get all tools for this toolkit
        const tools = await client.tools.getRawComposioTools({
          toolkits: [toolkitSlug],
          limit: 1000,
        });

        if (!tools || tools.length === 0) {
          console.warn(`[schema-sync] No tools found for NO_AUTH toolkit ${toolkitSlug}`);
          continue;
        }

        // Map to CachedToolSchema format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cachedTools: CachedToolSchema[] = (tools as any[]).map(
          (tool: any) => ({
            slug: tool.slug || tool.name || "",
            name: tool.displayName || tool.name || "",
            description: tool.description || "",
            inputParameters: tool.inputParameters || tool.parameters?.properties || {},
            outputParameters: tool.outputParameters || {},
            toolkitSlug,
          })
        );

        // Create CachedToolkit with NO_AUTH marker
        const cachedToolkit: CachedToolkit = {
          slug: toolkitSlug,
          name: toolkit.name || toolkitSlug,
          logo: toolkit.meta?.logo || null,
          tools: cachedTools,
          toolCount: cachedTools.length,
        };

        // Write to cache
        await writeToolkitCache(cachedToolkit);

        totalToolCount += cachedTools.length;
        toolkitSlugs.push(toolkitSlug);

        console.log(
          `[schema-sync] Cached NO_AUTH ${toolkitSlug}: ${cachedTools.length} tools`
        );
      } catch (error) {
        console.error(
          `[schema-sync] Failed to sync NO_AUTH ${toolkitSlug}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Write metadata
    const durationMs = Date.now() - startTime;
    await writeCacheMeta({
      lastSyncedAt: new Date().toISOString(),
      toolkitCount: toolkitSlugs.length,
      totalToolCount,
      syncDurationMs: durationMs,
    });

    return NextResponse.json({
      success: true,
      toolkits: toolkitSlugs.length,
      tools: totalToolCount,
      durationMs,
    });
  } catch (error) {
    console.error("[schema-sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to sync schemas",
      },
      { status: 500 }
    );
  }
}

