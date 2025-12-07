import { NextResponse } from "next/server";
import { getComposioClient } from "@/app/api/connections/services/client";

export const runtime = "nodejs";

interface ComposioTool {
  slug?: string;
  name?: string;
  displayName?: string;
  description?: string;
  appName?: string;
  tags?: string[];
  parameters?: { properties?: Record<string, unknown> };
  inputParameters?: Record<string, unknown>;
  outputParameters?: Record<string, unknown>;
}

/**
 * GET /api/workflows-d/tools
 * Gets all available Composio tools grouped by toolkit for the workflow editor palette.
 */
export async function GET() {
  try {
    const client = getComposioClient();
    
    // Get popular toolkits - these are commonly used
    const popularToolkits = [
      "firecrawl",
      "gmail", 
      "github",
      "slack",
      "notion",
      "linear",
      "twitter",
      "browser_tool"
    ];

    const toolkitGroups: Array<{
      slug: string;
      name: string;
      logo?: string;
      tools: Array<{
        id: string;
        name: string;
        description: string;
        inputSchema: { type: string; properties: Record<string, unknown>; required?: string[] };
        outputSchema: { type: string; properties: Record<string, unknown> };
      }>;
    }> = [];

    for (const toolkitSlug of popularToolkits) {
      try {
        // Get toolkit info
        const toolkit = await client.toolkits.get(toolkitSlug);
        
        // Get tools for this toolkit
        const tools = await client.tools.getRawComposioTools({ 
          toolkits: [toolkitSlug], 
          limit: 50 
        }) as ComposioTool[];

        if (!tools || tools.length === 0) continue;

        toolkitGroups.push({
          slug: toolkitSlug,
          name: toolkit.name || toolkitSlug,
          logo: toolkit.meta?.logo,
          tools: tools.map((tool) => ({
            id: tool.slug || tool.name || "",
            name: tool.displayName || tool.name || "",
            description: tool.description || "",
            inputSchema: {
              type: "object" as const,
              properties: tool.inputParameters || tool.parameters?.properties || {},
              required: [], // Would need to extract from schema
            },
            outputSchema: {
              type: "object" as const,
              properties: tool.outputParameters || {},
            },
          })),
        });
      } catch (err) {
        console.warn(`[workflows-d/tools] Failed to fetch toolkit ${toolkitSlug}:`, err);
      }
    }

    return NextResponse.json({ toolkits: toolkitGroups });
  } catch (error) {
    console.error("API Error: Failed to get workflow tools:", error);
    return NextResponse.json(
      { message: "Failed to retrieve tools" },
      { status: 500 }
    );
  }
}




