import fs from "fs/promises";
import path from "path";
import { getAgentById } from "@/_tables/agents";
import type { ConnectionToolBinding } from "@/_tables/types";

/**
 * Scans the agents directory for folders matching the agentId (UUID).
 * Folder format: {name-slug}-{uuid}
 * Returns the folder name if found, null otherwise.
 */
async function getAgentFolderPath(agentId: string): Promise<string | null> {
  const agentsDir = path.join(process.cwd(), "_tables", "agents");
  
  try {
    const entries = await fs.readdir(agentsDir, { withFileTypes: true });
    
    // Look for folders that end with the agentId (UUID)
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith(`-${agentId}`)) {
        return entry.name;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[agent-config] Error scanning agents directory:`, error);
    return null;
  }
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
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");
  
  let fileContent: string;
  try {
    fileContent = await fs.readFile(agentFile, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read agent config file: ${folderName}/config.ts`);
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
  const folderName = await getAgentFolderPath(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  const agentFile = path.join(process.cwd(), "_tables", "agents", folderName, "config.ts");

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

