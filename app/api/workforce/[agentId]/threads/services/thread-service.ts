import { getAgentMemory } from "../../chat/services/memory";

/**
 * Thread Service
 * 
 * Provides CRUD operations for conversation threads using Mastra Memory.
 * Each agent has its own memory.db file at `_tables/agents/[agentId]/memory.db`.
 */

export interface ThreadSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadWithMessages {
  thread: ThreadSummary;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    createdAt: string;
  }>;
}

/**
 * Get all threads for a user (resourceId) and agent
 */
export async function getThreadsForUser(
  agentId: string,
  resourceId: string
): Promise<ThreadSummary[]> {
  const memory = getAgentMemory(agentId);
  
  const threads = await memory.getThreadsByResourceId({
    resourceId,
    orderBy: "updatedAt",
    sortDirection: "DESC",
  });

  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title || "Untitled",
    createdAt: thread.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: thread.updatedAt?.toISOString() || new Date().toISOString(),
  }));
}

/**
 * Get a specific thread with its messages
 */
export async function getThreadWithMessages(
  agentId: string,
  threadId: string,
  resourceId: string
): Promise<ThreadWithMessages | null> {
  const memory = getAgentMemory(agentId);
  
  const thread = await memory.getThreadById({ threadId });
  
  if (!thread) {
    return null;
  }

  // Verify the thread belongs to this user
  if (thread.resourceId !== resourceId) {
    return null;
  }

  // Get messages for the thread
  const { messagesV2 } = await memory.query({ threadId, resourceId });

  return {
    thread: {
      id: thread.id,
      title: thread.title || "Untitled",
      createdAt: thread.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: thread.updatedAt?.toISOString() || new Date().toISOString(),
    },
    messages: messagesV2.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system" | "tool",
      content: extractMessageContent(msg.content),
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
    })),
  };
}

/**
 * Extract text content from various message content formats.
 * Mastra stores messages in different formats depending on how they were created.
 */
function extractMessageContent(content: unknown): string {
  // Simple string
  if (typeof content === "string") {
    return content;
  }

  // Array of content parts (AI SDK format)
  if (Array.isArray(content)) {
    return content
      .filter((part: unknown) => {
        if (typeof part === "object" && part !== null && "type" in part) {
          return (part as { type: string }).type === "text";
        }
        return false;
      })
      .map((part: unknown) => {
        if (typeof part === "object" && part !== null && "text" in part) {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("\n");
  }

  // Object with parts array (messagesV2 format)
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    
    // Check for 'parts' array (common in messagesV2)
    if ("parts" in obj && Array.isArray(obj.parts)) {
      return obj.parts
        .filter((part: unknown) => {
          if (typeof part === "object" && part !== null && "type" in part) {
            return (part as { type: string }).type === "text";
          }
          return false;
        })
        .map((part: unknown) => {
          if (typeof part === "object" && part !== null && "text" in part) {
            return (part as { text: string }).text;
          }
          return "";
        })
        .join("\n");
    }
    
    // Check for direct 'content' field (nested)
    if ("content" in obj && typeof obj.content === "string") {
      return obj.content;
    }

    // Check for 'text' field
    if ("text" in obj && typeof obj.text === "string") {
      return obj.text;
    }
  }

  // Fallback: stringify if nothing else works
  return typeof content === "object" ? JSON.stringify(content) : String(content);
}

/**
 * Create a new thread
 */
export async function createThread(
  agentId: string,
  resourceId: string,
  title?: string
): Promise<ThreadSummary> {
  const memory = getAgentMemory(agentId);
  
  const thread = await memory.createThread({
    resourceId,
    title: title || "New Conversation",
    saveThread: true,
  });

  return {
    id: thread.id,
    title: thread.title || "New Conversation",
    createdAt: thread.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: thread.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Update a thread's title
 */
export async function updateThreadTitle(
  agentId: string,
  threadId: string,
  resourceId: string,
  title: string
): Promise<ThreadSummary | null> {
  const memory = getAgentMemory(agentId);
  
  // First verify the thread exists and belongs to user
  const existing = await memory.getThreadById({ threadId });
  
  if (!existing || existing.resourceId !== resourceId) {
    return null;
  }

  // Update the thread
  const updated = await memory.saveThread({
    thread: {
      ...existing,
      title,
      updatedAt: new Date(),
    },
  });

  return {
    id: updated.id,
    title: updated.title || title,
    createdAt: updated.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: updated.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Delete a thread
 */
export async function deleteThread(
  agentId: string,
  threadId: string,
  resourceId: string
): Promise<boolean> {
  const memory = getAgentMemory(agentId);
  
  // First verify the thread exists and belongs to user
  const existing = await memory.getThreadById({ threadId });
  
  if (!existing || existing.resourceId !== resourceId) {
    return false;
  }

  await memory.deleteThread(threadId);
  return true;
}

