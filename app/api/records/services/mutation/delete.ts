import fs from "fs/promises";
import path from "path";
import pl from "nodejs-polars";
import { getDataFrame, commitDataFrame } from "../io";

const BASE_DIR = path.join(process.cwd(), "_tables", "records");

export async function deleteRow(tableId: string, rowId: string) {
  let df = await getDataFrame(tableId);

  const initialCount = df.height;
  df = df.filter(pl.col("id").neq(pl.lit(rowId)));

  if (df.height === initialCount) {
    throw new Error("Row not found");
  }

  await commitDataFrame(tableId, df);
}

/**
 * Delete an entire table and all its data
 */
export async function deleteTable(tableId: string): Promise<boolean> {
  const tableDir = path.join(BASE_DIR, tableId);

  try {
    // Check if table exists
    await fs.access(tableDir);

    // Remove the entire table directory
    await fs.rm(tableDir, { recursive: true });
    console.log(`[deleteTable] Deleted table: ${tableId}`);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(`[deleteTable] Table not found: ${tableId}`);
      return false;
    }
    console.error(`[deleteTable] Error deleting table ${tableId}:`, error);
    throw error;
  }
}

