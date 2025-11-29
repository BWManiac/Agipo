import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { getAgentById } from "@/_tables/agents";

const UpdateToolsSchema = z.object({
  toolIds: z.array(z.string()),
});

// Map agent ID to filename
const getAgentFilename = (agentId: string): string | null => {
  const agent = getAgentById(agentId);
  if (!agent) return null;
  
  // Map agent IDs to filenames
  const idToFile: Record<string, string> = {
    pm: "mira-patel",
    marketing: "noah-reyes",
    support: "elena-park",
    engineering: "alex-kim",
  };
  
  return idToFile[agentId] || null;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await request.json();
    const { toolIds } = UpdateToolsSchema.parse(body);

    // Get filename from agent ID
    const filename = getAgentFilename(agentId);
    if (!filename) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    // Read agent config file
    const agentFile = path.join(process.cwd(), "_tables", "agents", `${filename}.ts`);
    let fileContent: string;
    
    try {
      fileContent = await fs.readFile(agentFile, "utf-8");
    } catch (error) {
      console.error(`[agents/tools] Failed to read file: ${agentFile}`, error);
      return NextResponse.json(
        { error: `Failed to read agent config file: ${filename}.ts` },
        { status: 404 }
      );
    }

    // Build toolIds string with proper formatting
    const toolIdsString = toolIds.map(id => `"${id}"`).join(", ");
    
    // Match toolIds line - must match the exact format: toolIds: ["id1", "id2"],
    // The regex captures the trailing comma if present
    const toolIdsPattern = /(toolIds:\s*)\[[^\]]*\](\s*,?)/;
    const match = fileContent.match(toolIdsPattern);
    
    if (!match) {
      console.error(`[agents/tools] Could not find toolIds pattern in ${filename}.ts`);
      return NextResponse.json(
        { error: "Could not find toolIds in agent config file" },
        { status: 400 }
      );
    }

    // Replace with new toolIds array, preserving spacing and trailing comma
    const updatedContent = fileContent.replace(
      toolIdsPattern,
      `$1[${toolIdsString}]$2`
    );

    try {
      await fs.writeFile(agentFile, updatedContent, "utf-8");
      console.log(`[agents/tools] Successfully updated ${filename}.ts with tools: [${toolIds.join(", ")}]`);
    } catch (error) {
      console.error(`[agents/tools] Failed to write file: ${agentFile}`, error);
      return NextResponse.json(
        { error: "Failed to write agent config file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, toolIds });
  } catch (error) {
    console.error("[agents/tools] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent tools" },
      { status: 500 }
    );
  }
}

