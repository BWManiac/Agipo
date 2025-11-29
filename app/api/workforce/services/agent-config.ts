import fs from "fs/promises";
import path from "path";
import { getAgentById } from "@/_tables/agents";

// Map agent ID to filename
const idToFile: Record<string, string> = {
  pm: "mira-patel",
  marketing: "noah-reyes",
  support: "elena-park",
  engineering: "alex-kim",
};

function getAgentFilename(agentId: string): string | null {
  const agent = getAgentById(agentId);
  if (!agent) return null;
  return idToFile[agentId] || null;
}

/**
 * Updates the list of tools assigned to an agent by modifying the source file.
 */
export async function updateAgentTools(agentId: string, toolIds: string[]): Promise<void> {
  const filename = getAgentFilename(agentId);
  if (!filename) {
    throw new Error(`Agent not found or not mapped to file: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", `${filename}.ts`);
  
  let fileContent: string;
  try {
    fileContent = await fs.readFile(agentFile, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read agent config file: ${filename}.ts`);
  }

  // Build toolIds string: ["id1", "id2"]
  const toolIdsString = toolIds.map(id => `"${id}"`).join(", ");
  
  // Regex to match: toolIds: ["...", "..."],
  const toolIdsPattern = /(toolIds:\s*)\[[^\]]*\](\s*,?)/;
  
  if (!fileContent.match(toolIdsPattern)) {
    throw new Error("Could not find toolIds pattern in agent config file");
  }

  const updatedContent = fileContent.replace(
    toolIdsPattern,
    `$1[${toolIdsString}]$2`
  );

  await fs.writeFile(agentFile, updatedContent, "utf-8");
}

