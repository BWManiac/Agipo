/**
 * Generic JSON Schema types and validators
 * 
 * Defines Zod validators for JSON Schema format (used for workflow input/output schemas).
 * This is separate from composio-schemas.ts which contains Composio-specific cached schema types.
 */

import { z } from "zod";

/**
 * Zod validator for JSON Schema objects.
 * Used to validate input/output schemas in workflow definitions and steps.
 */
export const JSONSchemaValidator = z.object({
  type: z.enum(["object", "array", "string", "number", "boolean", "integer"]).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  items: z.any().optional(),
  required: z.array(z.string()).optional(),
  format: z.string().optional(),
  enum: z.array(z.unknown()).optional(),
}).passthrough(); // Allow additional JSON Schema properties

/**
 * Type for JSON Schema objects
 */
export type JSONSchema = z.infer<typeof JSONSchemaValidator>;
