import { z } from "zod";

/**
 * Data mapping types for connecting workflow steps.
 * Enables users to visually map data between steps (e.g., output of step 1 → input of step 2).
 * Powers the data mapping UI where users drag connections between steps.
 * Validates type compatibility and provides visual feedback on mapping quality.
 */
export const FieldMappingValidator = z.object({
  sourcePath: z.string(), // e.g., "data.title" or "result.user.email"
  targetField: z.string(), // e.g., "jobTitle"
  sourceType: z.string().optional(),
  targetType: z.string().optional(),
  typeMatch: z.enum(["exact", "coercible", "incompatible"]).optional(),
});

export type FieldMapping = z.infer<typeof FieldMappingValidator>;

export const DataMappingValidator = z.object({
  id: z.string(),
  sourceStepId: z.string(), // Step providing data, or "__input__"
  targetStepId: z.string(), // Step receiving data, or "__output__"
  fieldMappings: z.array(FieldMappingValidator),
});

export type DataMapping = z.infer<typeof DataMappingValidator>;


