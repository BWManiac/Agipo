import { NextResponse } from "next/server";
import { listAuthConfigs, getToolsForToolkit } from "@/app/api/connections/services/composio";
import { getComposioClient } from "@/app/api/connections/services/client";

export const runtime = "nodejs";

/** NO_AUTH toolkit slugs that work without user authentication */
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

interface Tool {
  id: string;
  name: string;
  description: string;
}

interface Integration {
  slug: string;
  name: string;
  logo?: string;
  authMode: string;
  tools: Tool[];
}

/**
 * GET /api/workflows/composio-schemas/available-integrations
 * Fetches ALL available integrations and their tools from Composio.
 * Deduplicates by slug since multiple auth configs can exist for the same integration.
 * 
 * Note: This is a live API endpoint (not cached). For cached data, use /composio-schemas/all
 */
export async function GET() {
  try {
    // Get all available auth configs (integrations)
    const authConfigs = await listAuthConfigs();
    
    if (!authConfigs?.items?.length) {
      return NextResponse.json({ integrations: [] });
    }

    // Dedupe configs by toolkit slug (multiple auth configs can exist for same integration)
    const seenSlugs = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueConfigs = authConfigs.items.filter((config: any) => {
      const slug = config.toolkit?.slug || config.appId || "";
      if (!slug || seenSlugs.has(slug)) return false;
      seenSlugs.add(slug);
      return true;
    });

    // Fetch tools for each unique integration in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const integrationPromises = uniqueConfigs.map(async (config: any) => {
      const slug = config.toolkit?.slug || config.appId || "";

      try {
        const rawTools = await getToolsForToolkit(slug);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools: Tool[] = (rawTools || []).map((tool: any) => ({
          id: tool.slug || tool.name || "",
          name: tool.displayName || tool.name || "",
          description: tool.description || "",
        }));

        // Skip integrations with no tools
        if (tools.length === 0) return null;

        return {
          slug,
          name: config.toolkit?.name || config.name || slug,
          logo: config.toolkit?.logo,
          authMode: config.authConfig?.mode || "UNKNOWN",
          tools,
        } as Integration;
      } catch (e) {
        console.warn(`[available-integrations] Failed to fetch tools for ${slug}:`, e);
        return null;
      }
    });

    const results = await Promise.all(integrationPromises);
    const integrations = results.filter((i): i is Integration => i !== null);

    // =========================================================================
    // Add NO_AUTH platform toolkits (e.g., browser_tool)
    // These don't require user authentication and are available to everyone
    // =========================================================================
    const client = getComposioClient();
    for (const slug of NO_AUTH_TOOLKIT_SLUGS) {
      // Skip if already included via auth configs
      if (seenSlugs.has(slug)) continue;

      try {
        const toolkit = await client.toolkits.get(slug);
        const rawTools = await client.tools.getRawComposioTools({
          toolkits: [slug],
          limit: 1000,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools: Tool[] = (rawTools || []).map((tool: any) => ({
          id: tool.slug || tool.name || "",
          name: tool.displayName || tool.name || "",
          description: tool.description || "",
        }));

        if (tools.length > 0) {
          integrations.push({
            slug,
            name: toolkit.name || slug,
            logo: toolkit.meta?.logo,
            authMode: "NO_AUTH",
            tools,
          });
        }
      } catch (e) {
        console.warn(`[available-integrations] Failed to fetch NO_AUTH toolkit ${slug}:`, e);
      }
    }

    // Sort by name
    integrations.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("[available-integrations] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

