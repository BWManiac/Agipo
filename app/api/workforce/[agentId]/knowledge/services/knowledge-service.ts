import { getAgentMemory } from "../../chat/services/memory";
import type { WorkingMemory } from "../../chat/types/working-memory";

/**
 * Knowledge Service
 * 
 * Provides operations for reading and clearing agent working memory.
 * Working memory is scoped per-user (resourceId) across all conversations.
 */

export interface KnowledgeResponse {
  knowledge: WorkingMemory | null;
  updatedAt: string | null;
}

/**
 * Get working memory for a user
 * 
 * Note: Working memory in Mastra is scoped by threadId AND resourceId.
 * Since we use scope: 'resource', we need to pass a threadId but the
 * memory is shared across all threads for the user.
 */
export async function getWorkingMemory(
  agentId: string,
  resourceId: string
): Promise<KnowledgeResponse> {
  const memory = getAgentMemory(agentId);

  try {
    // Get working memory - need a threadId but with scope: 'resource' 
    // it returns the same data for all threads belonging to this resourceId
    const workingMemoryJson = await memory.getWorkingMemory({
      threadId: "__resource__", // Placeholder since scope is 'resource'
      resourceId,
    });

    if (!workingMemoryJson) {
      return { knowledge: null, updatedAt: null };
    }

    // Parse the JSON string into our WorkingMemory type
    const knowledge = JSON.parse(workingMemoryJson) as WorkingMemory;
    
    return {
      knowledge,
      updatedAt: new Date().toISOString(), // TODO: Get actual timestamp from storage
    };
  } catch (error) {
    console.error("[knowledge-service] getWorkingMemory error:", error);
    return { knowledge: null, updatedAt: null };
  }
}

/**
 * Clear working memory for a user
 */
export async function clearWorkingMemory(
  agentId: string,
  resourceId: string
): Promise<boolean> {
  const memory = getAgentMemory(agentId);

  try {
    // Update with empty object to clear
    await memory.updateWorkingMemory({
      threadId: "__resource__",
      resourceId,
      workingMemory: JSON.stringify({}),
    });
    
    return true;
  } catch (error) {
    console.error("[knowledge-service] clearWorkingMemory error:", error);
    return false;
  }
}

