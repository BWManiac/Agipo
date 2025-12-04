import fs from "fs/promises";
import path from "path";
import { getAgentById } from "@/_tables/agents";
import type { ConnectionToolBinding } from "@/_tables/types";

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
 * Gets the custom tool IDs assigned to an agent.
 */
export function getAgentCustomTools(agentId: string): string[] {
  const agent = getAgentById(agentId);
  if (!agent) return [];
  return agent.toolIds || [];
}

/**
 * Gets the connection tool bindings assigned to an agent.
 */
export function getAgentConnectionToolBindings(agentId: string): ConnectionToolBinding[] {
  const agent = getAgentById(agentId);
  if (!agent) return [];
  return agent.connectionToolBindings || [];
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

/**
 * Updates the connection tool bindings assigned to an agent by modifying the source file.
 */
export async function updateConnectionToolBindings(
  agentId: string,
  bindings: ConnectionToolBinding[]
): Promise<void> {
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

  // Build bindings string
  const bindingsString =
    bindings.length === 0
      ? "[]"
      : `[\n    ${bindings
          .map(
            (b) =>
              `{ toolId: "${b.toolId}", connectionId: "${b.connectionId}", toolkitSlug: "${b.toolkitSlug}" }`
          )
          .join(",\n    ")},\n  ]`;

  // Check if connectionToolBindings already exists
  const existingPattern = /(connectionToolBindings:\s*)\[[^\]]*\](\s*,?)/;
  
  if (fileContent.match(existingPattern)) {
    // Update existing field
    const updatedContent = fileContent.replace(
      existingPattern,
      `$1${bindingsString}$2`
    );
    await fs.writeFile(agentFile, updatedContent, "utf-8");
  } else {
    // Add new field after toolIds
    const toolIdsPattern = /(toolIds:\s*\[[^\]]*\])(\s*,?)/;
    if (!fileContent.match(toolIdsPattern)) {
      throw new Error("Could not find toolIds pattern in agent config file");
    }
    const updatedContent = fileContent.replace(
      toolIdsPattern,
      `$1$2\n  connectionToolBindings: ${bindingsString},`
    );
    await fs.writeFile(agentFile, updatedContent, "utf-8");
  }
}

