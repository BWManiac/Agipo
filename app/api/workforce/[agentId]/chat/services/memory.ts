import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { workingMemorySchema } from "../types/working-memory";
import * as fs from "fs";
import * as path from "path";

// Cache Memory instances to avoid recreating on every request
const memoryCache = new Map<string, Memory>();

/**
 * Creates a per-agent Memory instance for conversation persistence.
 * 
 * Storage: SQLite file at `_tables/agents/{agentId}/memory.db`
 * 
 * Features enabled:
 * - lastMessages: Keeps last 10 messages in context
 * - workingMemory: Structured knowledge about users (per-user scope)
 * - threads.generateTitle: Auto-generates thread titles from first message
 * 
 * @param agentId - The agent's unique identifier (e.g., "pm", "alex-kim")
 * @returns Memory instance configured for the agent
 */
export function getAgentMemory(agentId: string): Memory {
  // Check cache first
  const cached = memoryCache.get(agentId);
  if (cached) {
    return cached;
  }

  // Ensure the agent directory exists
  const agentDir = path.join(process.cwd(), "_tables", "agents", agentId);
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
    console.log(`[memory] Created agent directory: ${agentDir}`);
  }

  // Resolve the path relative to the project root
  // LibSQL uses file: protocol for local SQLite databases
  const dbPath = `file:${agentDir}/memory.db`;

  console.log(`[memory] Initializing memory for agent: ${agentId}, path: ${dbPath}`);

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

