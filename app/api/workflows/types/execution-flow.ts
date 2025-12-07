import { z } from "zod";

/**
 * Control flow types for workflow execution patterns.
 * Enables users to create complex workflows with branches, parallel execution, and loops.
 * Powers conditional logic (if/then), parallel processing, and iterative operations.
 * Separates execution logic from step definitions for clarity.
 */

// Control flow type enum
export const ControlFlowTypeValidator = z.enum([
  "branch",
  "parallel",
  "loop",
  "foreach",
  "wait",
  "suspend",
]);

export type ControlFlowType = z.infer<typeof ControlFlowTypeValidator>;

// Branch condition (each condition in a branch router)
export const BranchConditionValidator = z.object({
  id: z.string(),
  label: z.string(), // Display name: "High Priority", "Gold Tier"
  expression: z.string(), // JS expression: "score >= 90"
  color: z.string().optional(), // Visual distinction: "green", "blue", etc.
});

export type BranchCondition = z.infer<typeof BranchConditionValidator>;

// Branch config (router with multiple conditions)
export const BranchConfigValidator = z.object({
  conditions: z.array(BranchConditionValidator),
  hasElse: z.boolean().default(true), // Include "else" catch-all lane
});

export type BranchConfig = z.infer<typeof BranchConfigValidator>;

// Parallel lane (each lane in a parallel fork)
export const ParallelLaneValidator = z.object({
  id: z.string(),
  label: z.string(), // Display name: "A", "B", "C"
});

export type ParallelLane = z.infer<typeof ParallelLaneValidator>;

// Parallel config (fork/join with multiple lanes)
export const ParallelConfigValidator = z.object({
  lanes: z.array(ParallelLaneValidator),
  waitForAll: z.boolean().default(true), // Wait for all lanes to complete
  failFast: z.boolean().default(false), // Abort remaining if one fails
});

export type ParallelConfig = z.infer<typeof ParallelConfigValidator>;

// Loop config (do-until or do-while)
export const LoopConfigValidator = z.object({
  type: z.enum(["until", "while"]),
  condition: z.string(), // JS expression: "status === 'done'"
  maxIterations: z.number().default(100),
});

export type LoopConfig = z.infer<typeof LoopConfigValidator>;

// ForEach config (iterate over array)
export const ForEachConfigValidator = z.object({
  arraySource: z.string(), // Expression for the array: "items" or "previousStep.results"
  itemVariable: z.string().default("item"), // Variable name for current item
  indexVariable: z.string().default("index"), // Variable name for current index
  concurrency: z.number().default(1), // How many items to process in parallel
});

export type ForEachConfig = z.infer<typeof ForEachConfigValidator>;

// Wait config (pause for duration or until time)
export const WaitConfigValidator = z.object({
  type: z.enum(["duration", "until"]),
  durationMs: z.number().optional(), // Milliseconds to wait
  untilTime: z.string().optional(), // ISO date string
});

export type WaitConfig = z.infer<typeof WaitConfigValidator>;

// Suspend config (human-in-the-loop)
export const SuspendConfigValidator = z.object({
  message: z.string().optional(), // Message to show to human
  payload: z.any().optional(), // Data to pass to human
});

export type SuspendConfig = z.infer<typeof SuspendConfigValidator>;

// Overall workflow control flow config
export const ControlFlowConfigValidator = z.object({
  type: z.enum(["sequential", "parallel", "branched", "mixed"]),
  order: z.array(z.string()).optional(), // Step IDs in execution order
  parallelGroups: z.array(z.array(z.string())).optional(), // Groups of step IDs that run in parallel
  branches: z.array(BranchConfigValidator).optional(),
});

export type ControlFlowConfig = z.infer<typeof ControlFlowConfigValidator>;


