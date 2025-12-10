import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { workingMemorySchema } from "../types/working-memory";
import * as fs from "fs";
import * as path from "path";

// Cache Memory instances to avoid recreating on every request
const memoryCache = new Map<string, Memory>();

/**
 * Scans the agents directory for folders matching the agentId (UUID).
 * Folder format: {name-slug}-{uuid}
 * Returns the folder name if found, null otherwise.
 */
function getAgentFolderName(agentId: string): string | null {
  const agentsDir = path.join(process.cwd(), "_tables", "agents");
  
  try {
    const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
    
    // Look for folders that end with the agentId (UUID)
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith(`-${agentId}`)) {
        return entry.name;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[memory] Error scanning agents directory:`, error);
    return null;
  }
}

/**
 * Creates a per-agent Memory instance for conversation persistence.
 * 
 * Storage: SQLite file at `_tables/agents/{folder-name}/memory.db`
 * 
 * Features enabled:
 * - lastMessages: Keeps last 10 messages in context
 * - workingMemory: Structured knowledge about users (per-user scope)
 * - threads.generateTitle: Auto-generates thread titles from first message
 * 
 * @param agentId - The agent's unique identifier (UUID)
 * @returns Memory instance configured for the agent
 */
export function getAgentMemory(agentId: string): Memory {
  // Check cache first
  const cached = memoryCache.get(agentId);
  if (cached) {
    return cached;
  }

  // Map UUID agentId to folder name
  const folderName = getAgentFolderName(agentId);
  if (!folderName) {
    throw new Error(`Agent folder not found for agentId: ${agentId}`);
  }

  // Ensure the agent directory exists
  const agentDir = path.join(process.cwd(), "_tables", "agents", folderName);
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
    console.log(`[memory] Created agent directory: ${agentDir}`);
  }

  // Resolve the path relative to the project root
  // LibSQL uses file: protocol for local SQLite databases
  const dbPath = `file:${agentDir}/memory.db`;

  console.log(`[memory] Initializing memory for agent: ${agentId}, folder: ${folderName}, path: ${dbPath}`);

  const memory = new Memory({
    storage: new LibSQLStore({
      url: dbPath,
    }),
    options: {
      // Keep last 10 messages in context for continuity
      lastMessages: 10,

      // Working memory: structured knowledge about users
      // Agent can autonomously update this during conversations
      workingMemory: {
        enabled: true,
        scope: "resource", // Per-user, across all threads
        schema: workingMemorySchema,
      },

      // Thread management
      threads: {
        generateTitle: true, // Auto-generate from first message
      },
    },
  });

  // Cache the instance
  memoryCache.set(agentId, memory);

  return memory;
}

