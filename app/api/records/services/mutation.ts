import pl from "nodejs-polars";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDataFrame, commitDataFrame, readSchema } from "./io";

/**
 * Generates a dynamic Zod validator based on the Table Schema.
 */
function generateRowValidator(schema: any) {
  const shape: Record<string, any> = {};
  
  schema.columns.forEach((col: any) => {
    // Skip system columns in validation if they are auto-generated
    if (col.id === "id" || col.id === "_created" || col.id === "_updated") return;

    let validator;
    switch (col.type) {
      case "number":
        validator = z.number();
        break;
      case "date":
        validator = z.string().datetime().or(z.string()); // Allow strict ISO or plain date string
        break;
      case "boolean":
        validator = z.boolean();
        break;
      case "select":
        validator = z.string();
        if (col.options && col.options.length > 0) {
          validator = z.enum(col.options as [string, ...string[]]);
        }
        break;
      case "text":
      default:
        validator = z.string();
    }

    if (!col.required) validator = validator.optional().or(z.null());
    
    // Use Name or ID? Ideally ID, but user might send Name. 
    // For now assume payload keys match Schema IDs.
    shape[col.id] = validator;
  });

  return z.object(shape);
}

export async function insertRow(tableId: string, rowData: Record<string, any>) {
  const schema = await readSchema(tableId);
  if (!schema) throw new Error("Table not found");

  // 1. Validate Input
  const validator = generateRowValidator(schema);
  const cleanData = validator.parse(rowData);

  // 2. Add System Fields
  const fullRow = {
    id: nanoid(),
    _created: new Date().toISOString(),
    _updated: new Date().toISOString(),
    ...cleanData,
  };

  // 3. Load & Append
  let df = await getDataFrame(tableId);
  const newRowDf = pl.DataFrame([fullRow]);
  
  // Align columns (if new schema has cols that old DF doesn't, or vice versa)
  // Polars vstack requires strictly matching schema.
  // This is tricky. For MVP, we assume DF schema matches or we rebuild it.
  
  if (df.height === 0) {
    df = newRowDf;
  } else {
    try {
      df = df.vstack(newRowDf);
    } catch (e) {
      // Schema mismatch handling (e.g. backfilling nulls)
      // Advanced: Re-cast existing DF to match new schema.
      // For now, let's error to see it happen.
      console.error("Schema Mismatch on Insert:", e);
      throw new Error("Data structure mismatch. Schema evolution required.");
    }
  }

  // 4. Commit
  await commitDataFrame(tableId, df);
  return fullRow;
}

export async function updateRow(tableId: string, rowId: string, updates: Record<string, any>) {
  const df = await getDataFrame(tableId);
  if (df.height === 0) throw new Error("Table is empty");

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

  const newDf = pl.DataFrame(newRecords);
  await commitDataFrame(tableId, newDf);
  return updates;
}

export async function deleteRow(tableId: string, rowId: string) {
  let df = await getDataFrame(tableId);
  
  const initialCount = df.height;
  df = df.filter(pl.col("id").neq(pl.lit(rowId)));
  
  if (df.height === initialCount) {
    throw new Error("Row not found");
  }

  await commitDataFrame(tableId, df);
}

