import path from "path";
import fs from "fs/promises";
import pl from "nodejs-polars";
import { z } from "zod";

const BASE_DIR = path.join(process.cwd(), "_tables", "data");

export const TableSchemaValidator = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  columns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["text", "number", "date", "boolean", "select"]),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(), // For 'select' type
    })
  ),
  lastModified: z.string().optional(),
});

export type TableSchema = z.infer<typeof TableSchemaValidator>;

/**
 * Ensures the table directory exists.
 */
export async function ensureTableDir(tableId: string): Promise<string> {
  const dir = path.join(BASE_DIR, tableId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Reads the schema.json for a table.
 */
export async function readSchema(tableId: string): Promise<TableSchema | null> {
  try {
    const filePath = path.join(BASE_DIR, tableId, "schema.json");
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Writes the schema.json for a table.
 */
export async function writeSchema(tableId: string, schema: TableSchema): Promise<void> {
  const dir = await ensureTableDir(tableId);
  await fs.writeFile(path.join(dir, "schema.json"), JSON.stringify(schema, null, 2));
}

/**
 * Reads the records.json into a Polars DataFrame.
 * Returns an empty DataFrame with correct types if file doesn't exist.
 */
export async function getDataFrame(tableId: string): Promise<pl.DataFrame> {
  const filePath = path.join(BASE_DIR, tableId, "records.json");
  
  try {
    await fs.access(filePath);
    // Use scanJson for lazy loading potential in future, but readJson for now
    return pl.readJSON(filePath);
  } catch (e) {
    // If file doesn't exist, return empty DF
    return pl.DataFrame({});
  }
}

/**
 * Writes a Polars DataFrame to records.json.
 */
export async function commitDataFrame(tableId: string, df: pl.DataFrame): Promise<void> {
  const dir = await ensureTableDir(tableId);
  const filePath = path.join(dir, "records.json");
  
  // Polars writes compressed JSON (single line) by default or when using writeJSON.
  // To make it pretty, we need to convert to JS object first, then stringify with indentation.
  // This is a trade-off: Prettiness vs Performance.
  // For Agipo (Inspectability > Speed for <100k rows), we choose Pretty.
  
  const records = df.toRecords();
  const json = JSON.stringify(records, null, 2);
  await fs.writeFile(filePath, json);
}

/**
 * Deletes a table directory completely.
 */
export async function deleteTableFiles(tableId: string): Promise<void> {
  const dir = path.join(BASE_DIR, tableId);
  await fs.rm(dir, { recursive: true, force: true });
}
