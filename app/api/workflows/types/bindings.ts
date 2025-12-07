import { z } from "zod";

/**
 * Types for data bindings between workflow steps.
 * Enables users to configure where each step input comes from:
 * - Previous step output (e.g., step1.data.url)
 * - Workflow input parameter (e.g., recipient_email)
 * - Literal value (e.g., "Hello World")
 */

export const BindingSourceTypeValidator = z.enum([
  "step-output",
  "workflow-input", 
  "literal",
]);
export type BindingSourceType = z.infer<typeof BindingSourceTypeValidator>;

export const FieldBindingValidator = z.object({
  targetStepId: z.string(),
  targetField: z.string(),
  sourceType: BindingSourceTypeValidator,
  // For step-output
  sourceStepId: z.string().optional(),
  sourcePath: z.string().optional(),
  // For workflow-input
  workflowInputName: z.string().optional(),
  // For literal
  literalValue: z.unknown().optional(),
});
export type FieldBinding = z.infer<typeof FieldBindingValidator>;

export const StepBindingsValidator = z.object({
  stepId: z.string(),
  inputBindings: z.record(z.string(), FieldBindingValidator),
});
export type StepBindings = z.infer<typeof StepBindingsValidator>;

export const WorkflowInputDefinitionValidator = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
});
export type WorkflowInputDefinition = z.infer<typeof WorkflowInputDefinitionValidator>;

