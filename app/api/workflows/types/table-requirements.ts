import { z } from "zod";

/**
 * Table integration types for workflows that interact with structured data.
 * Enables workflows to read from and write to data tables (Records feature).
 * Powers the table binding UI where users connect workflow outputs to table columns.
 * Validates table schema requirements and column mappings.
 */
export const ColumnRequirementValidator = z.object({
  key: z.string(), // How workflow references it: "job_title"
  suggestedName: z.string(), // Suggested column name: "Job Title"
  type: z.enum(["text", "number", "date", "boolean", "select"]),
  required: z.boolean(),
});

export type ColumnRequirement = z.infer<typeof ColumnRequirementValidator>;

export const TableRequirementValidator = z.object({
  key: z.string(), // Internal reference: "output_table"
  purpose: z.enum(["read", "write", "readwrite"]),
  description: z.string(), // "Table to store scraped job listings"
  requiredColumns: z.array(ColumnRequirementValidator),
  optionalColumns: z.array(ColumnRequirementValidator).optional(),
  canAutoCreate: z.boolean(), // Show "Create new table" option
  autoCreateName: z.string().optional(), // Suggested name for new table
});

export type TableRequirement = z.infer<typeof TableRequirementValidator>;

export const TableBindingValidator = z.object({
  tableId: z.string(), // ID of the bound table
  columnMapping: z.record(z.string(), z.string()), // workflow column → table column
});

export type TableBinding = z.infer<typeof TableBindingValidator>;

export const QueryTableConfigValidator = z.object({
  filter: z.object({
    column: z.string(),
    operator: z.enum(["eq", "neq", "gt", "lt", "contains"]),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }).optional(),
  sort: z.object({
    column: z.string(),
    descending: z.boolean().optional(),
  }).optional(),
  limit: z.number().optional(),
});

export type QueryTableConfig = z.infer<typeof QueryTableConfigValidator>;

export const WriteTableConfigValidator = z.object({
  mode: z.enum(["insert", "upsert"]),
  upsertKey: z.string().optional(),
});

export type WriteTableConfig = z.infer<typeof WriteTableConfigValidator>;


