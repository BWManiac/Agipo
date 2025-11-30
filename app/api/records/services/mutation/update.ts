import pl from "nodejs-polars";
import { getDataFrame, commitDataFrame, readSchema } from "../io";
import { alignDataFrameToSchema } from "./utils/alignment";

export async function updateRow(tableId: string, rowId: string, updates: Record<string, any>) {
  const schema = await readSchema(tableId);
  if (!schema) throw new Error("Table not found");
  
  let df = await getDataFrame(tableId);
  if (df.height === 0) throw new Error("Table is empty");

  // Align DataFrame to current schema (handles schema evolution)
  df = alignDataFrameToSchema(df, schema);

  // Polars is immutable. We can't "update". We must Replace or Construct new.
  // Method: Convert to Records -> Map -> Re-create DF.
  // This is slow for 1M rows but fine for MVP (<10k).
  
  // Optimization: Use lazy expressions if possible, but `map` is easier for arbitrary updates.
  
  const records = df.toRecords();
  let found = false;
  
  const newRecords = records.map((r: any) => {
    if (r.id === rowId) {
      found = true;
      return {
        ...r,
        ...updates,
        _updated: new Date().toISOString(),
      };
    }
    return r;
  });

  if (!found) throw new Error("Row not found");

  // Recreate DataFrame - it will have the correct schema from aligned records
  const newDf = pl.DataFrame(newRecords);
  
  // Ensure final DataFrame is aligned to schema (handles any edge cases)
  const finalDf = alignDataFrameToSchema(newDf, schema);
  
  await commitDataFrame(tableId, finalDf);
  return updates;
}

