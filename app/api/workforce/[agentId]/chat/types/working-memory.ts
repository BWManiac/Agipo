import { z } from "zod";

/**
 * Working Memory Schema for Mastra Agents
 * 
 * This schema defines the structured knowledge that agents can remember
 * about users across conversations. The agent autonomously decides when
 * to update this memory based on conversation context.
 * 
 * Scoped per-user (resourceId) across all threads.
 */

export const workingMemorySchema = z.object({
  /**
   * How the user prefers to receive information
   */
  communicationPreferences: z.object({
    /** formal | casual | technical */
    style: z.enum(["formal", "casual", "technical"]).optional(),
    /** concise | detailed */
    responseLength: z.enum(["concise", "detailed"]).optional(),
    /** paragraphs | bullets | mixed */
    formatPreference: z.enum(["paragraphs", "bullets", "mixed"]).optional(),
  }).optional(),

  /**
   * Projects the user is currently working on
   */
  activeProjects: z.array(z.object({
    name: z.string(),
    status: z.enum(["active", "blocked", "completed"]).optional(),
    notes: z.string().optional(),
  })).optional(),

  /**
   * Important contextual information to remember
   */
  keyContext: z.array(z.string()).optional(),

  /**
   * Decisions made during conversations
   */
  recentDecisions: z.array(z.object({
    decision: z.string(),
    date: z.string().optional(),
  })).optional(),
});

export type WorkingMemory = z.infer<typeof workingMemorySchema>;

