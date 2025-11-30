import { nanoid } from "nanoid";
import { z } from "zod";
import { readSchema, writeSchema, TableSchema, TableSchemaValidator } from "./io";

/**
 * Validates and sanitizes a new column definition.
 */
export const ColumnInputValidator = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "number", "date", "boolean", "select"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export type ColumnInput = z.infer<typeof ColumnInputValidator>;

export async function createTableSchema(
  id: string,
  name: string,
  description?: string
): Promise<TableSchema> {
  const schema: TableSchema = {
    id,
    name,
    description,
    columns: [
      // Default System Columns
      { id: "id", name: "ID", type: "text", required: true },
      { id: "_created", name: "Created At", type: "date", required: true },
      { id: "_updated", name: "Updated At", type: "date", required: true },
    ],
    lastModified: new Date().toISOString(),
  };

  await writeSchema(id, schema);
  return schema;
}

export async function addColumn(tableId: string, input: ColumnInput): Promise<TableSchema> {
  const schema = await readSchema(tableId);
  if (!schema) throw new Error(`Table ${tableId} not found`);

  const newCol = {
    id: nanoid(8), // Short ID for internal use
    ...input,
  };

  // Duplicate name check
  if (schema.columns.some((c) => c.name.toLowerCase() === input.name.toLowerCase())) {
    throw new Error(`Column "${input.name}" already exists`);
  }

  schema.columns.push(newCol);
  schema.lastModified = new Date().toISOString();

  await writeSchema(tableId, schema);
  return schema;
}

export async function getTableSchema(tableId: string): Promise<TableSchema | null> {
  return readSchema(tableId);
}

