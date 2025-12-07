import { z } from "zod";

/**
 * Runtime configuration types for workflow execution.
 * Enables users to configure workflows with runtime inputs (provided per execution) and persistent configs (saved settings).
 * Powers the "Inputs" and "Config" tabs in the editor sidebar.
 * Separates per-execution data from persistent workflow settings.
 */
export const RuntimeInputConfigValidator = z.object({
  key: z.string(), // e.g., "jobUrl"
  type: z.enum(["string", "number", "boolean", "array", "object"]),
  label: z.string(), // Display label
  description: z.string().optional(),
  required: z.boolean(),
  default: z.unknown().optional(),
  validation: z.object({
    format: z.enum(["email", "url", "date"]).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export type RuntimeInputConfig = z.infer<typeof RuntimeInputConfigValidator>;

export const WorkflowConfigValidator = z.object({
  key: z.string(), // e.g., "resumeTemplate"
  type: z.enum(["text", "number", "boolean", "select"]),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  default: z.unknown().optional(),
  options: z.array(z.string()).optional(), // For select type
});

export type WorkflowConfig = z.infer<typeof WorkflowConfigValidator>;


