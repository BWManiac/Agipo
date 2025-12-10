import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { AgentConfig } from "@/_tables/types";

/**
 * Generates a UUID v4 for use as an agent ID.
 */
export function generateAgentId(): string {
  return randomUUID();
}

/**
 * Converts a name to a URL-friendly slug.
 * Example: "Test Agent" -> "test-agent"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a folder name from agent name and UUID.
 * Format: {name-slug}-{uuid}
 * Example: "test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
export function generateFolderName(name: string, agentId: string): string {
  const slug = slugify(name);
  return `${slug}-${agentId}`;
}

/**
 * Converts a UUID to a valid JavaScript identifier.
 * Removes hyphens and ensures it doesn't start with a number.
 * Example: "1ae3aa46-b7b4-4477-916d-85ca120fe9e2" -> "agent1ae3aa46b7b44477916d85ca120fe9e2"
 */
function generateValidIdentifier(agentId: string): string {
  const camelCaseId = agentId.replace(/-/g, "");
  // Ensure it starts with a letter (JavaScript identifiers cannot start with numbers)
  if (/^[0-9]/.test(camelCaseId)) {
    return `agent${camelCaseId}`;
  }
  return camelCaseId;
}

/**
 * Generates the TypeScript file content for an agent config.
 */
export function generateAgentFileContent(
  agentId: string,
  name: string,
  role: string,
  systemPrompt: string,
  model: string,
  avatar: string,
  description: string,
  objectives: string[],
  guardrails: string[],
  isManager?: boolean,
  subAgentIds?: string[]
): string {
  const camelCaseId = generateValidIdentifier(agentId);
  const objectivesString =
    objectives.length > 0
      ? `[\n    ${objectives.map((obj) => `"${obj.replace(/"/g, '\\"')}"`).join(",\n    ")},\n  ]`
      : "[]";
  const guardrailsString =
    guardrails.length > 0
      ? `[\n    ${guardrails.map((g) => `"${g.replace(/"/g, '\\"')}"`).join(",\n    ")},\n  ]`
      : "[]";
  const subAgentIdsString =
    subAgentIds && subAgentIds.length > 0
      ? `[\n    ${subAgentIds.map((id) => `"${id}"`).join(",\n    ")},\n  ]`
      : undefined;

  const managerFields = isManager
    ? `\n  isManager: true,${subAgentIdsString ? `\n  subAgentIds: ${subAgentIdsString},` : ""}`
    : "";

  return `import type { AgentConfig } from "@/_tables/types";

export const ${camelCaseId}Agent: AgentConfig = {
  id: "${agentId}",
  name: "${name.replace(/"/g, '\\"')}",
  role: "${role.replace(/"/g, '\\"')}",
  avatar: "${avatar}",
  status: "active",
  description: "${description.replace(/"/g, '\\"')}",
  systemPrompt: "${systemPrompt.replace(/"/g, '\\"')}",
  model: "${model}",
  toolIds: [],
  connectionToolBindings: [],
  quickPrompts: [],
  objectives: ${objectivesString},
  guardrails: ${guardrailsString},
  highlight: "",
  lastActivity: new Date().toISOString(),
  metrics: [],
  assignedWorkflows: [],
  capabilities: [],
  insights: [],
  activities: [],
  feedback: [],${managerFields}
};
`;
}

/**
 * Creates the agent folder directory.
 */
export async function createAgentFolder(folderPath: string): Promise<void> {
  await fs.mkdir(folderPath, { recursive: true });
}

/**
 * Creates the agent config file in the folder.
 */
export async function createAgentConfigFile(
  folderPath: string,
  content: string
): Promise<void> {
  const configPath = path.join(folderPath, "config.ts");
  await fs.writeFile(configPath, content, "utf-8");
}

/**
 * Updates the agents index.ts file to include the new agent.
 * Uses regex to find the export statement and add the import + agent to the array.
 */
export async function updateAgentsIndex(
  folderName: string,
  agentId: string
): Promise<void> {
  const indexPath = path.join(process.cwd(), "_tables", "agents", "index.ts");
  
  let fileContent: string;
  try {
    fileContent = await fs.readFile(indexPath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read agents index file: ${indexPath}`);
  }

  const camelCaseId = generateValidIdentifier(agentId);
  const importStatement = `import { ${camelCaseId}Agent } from "./${folderName}/config";`;
  
  // Check if import already exists
  if (fileContent.includes(importStatement)) {
    // Agent already in index, skip update
    return;
  }

  // Add import at the top (after any existing imports or at the beginning)
  const importPattern = /^(import\s+.*?from\s+["'].*?["'];?\s*?\n)/m;
  const lastImportMatch = fileContent.match(/^(import\s+.*?from\s+["'].*?["'];?\s*?\n)/gm);
  
  let updatedContent: string;
  if (lastImportMatch && lastImportMatch.length > 0) {
    // Insert after last import
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    const lastImportIndex = fileContent.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    updatedContent =
      fileContent.slice(0, insertIndex) +
      importStatement +
      "\n" +
      fileContent.slice(insertIndex);
  } else {
    // No imports, add at the beginning
    updatedContent = importStatement + "\n\n" + fileContent;
  }

  // Update the agents array
  // Pattern: export const agents = [...];
  const agentsArrayPattern = /(export\s+const\s+agents\s*=\s*\[)([\s\S]*)(\];)/;
  const match = updatedContent.match(agentsArrayPattern);
  
  if (!match) {
    throw new Error("Could not find agents array in index.ts");
  }

  const beforeArray = match[1];
  const arrayContent = match[2].trim();
  const afterArray = match[3];

  // Add agent to array
  const newArrayContent =
    arrayContent.length > 0
      ? `${arrayContent},\n  ${camelCaseId}Agent`
      : `${camelCaseId}Agent`;

  updatedContent = updatedContent.replace(
    agentsArrayPattern,
    `${beforeArray}${newArrayContent}${afterArray}`
  );

  await fs.writeFile(indexPath, updatedContent, "utf-8");
}

/**
 * Main orchestrator function to create an agent.
 * Performs all steps with rollback on failure.
 */
export async function createAgent(
  name: string,
  role: string,
  systemPrompt: string,
  model: string,
  avatar: string,
  description: string,
  objectives: string[] = [],
  guardrails: string[] = [],
  isManager: boolean = false,
  subAgentIds: string[] = []
): Promise<{ agentId: string; folderName: string }> {
  // Generate agent ID and folder name
  const agentId = generateAgentId();
  const folderName = generateFolderName(name, agentId);
  const folderPath = path.join(process.cwd(), "_tables", "agents", folderName);

  let folderCreated = false;
  let configFileCreated = false;

  try {
    // Step 1: Create folder
    await createAgentFolder(folderPath);
    folderCreated = true;

    // Step 2: Generate and write config file
    const fileContent = generateAgentFileContent(
      agentId,
      name,
      role,
      systemPrompt,
      model,
      avatar,
      description,
      objectives,
      guardrails,
      isManager,
      subAgentIds
    );
    await createAgentConfigFile(folderPath, fileContent);
    configFileCreated = true;

    // Step 3: Update index.ts
    await updateAgentsIndex(folderName, agentId);

    return { agentId, folderName };
  } catch (error) {
    // Rollback: Delete created files/folders
    if (configFileCreated) {
      try {
        const configPath = path.join(folderPath, "config.ts");
        await fs.unlink(configPath);
      } catch (unlinkError) {
        console.error(`[agent-creator] Failed to delete config file during rollback:`, unlinkError);
      }
    }
    if (folderCreated) {
      try {
        await fs.rmdir(folderPath);
      } catch (rmdirError) {
        console.error(`[agent-creator] Failed to delete folder during rollback:`, rmdirError);
      }
    }
    throw error;
  }
}
