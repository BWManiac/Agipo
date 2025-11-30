import pl from "nodejs-polars";
import { nanoid } from "nanoid";
import { getDataFrame, commitDataFrame, readSchema } from "../io";
import { alignDataFrameToSchema, alignRowToSchema } from "./utils/alignment";
import { generateRowValidator } from "./utils/validation";
import { getPolarsTypeForSchemaType } from "./utils/types";

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

  // 3. Load & Align DataFrames to Schema
  let df = await getDataFrame(tableId);
  
  // Align existing DataFrame to current schema (adds missing columns with null)
  df = alignDataFrameToSchema(df, schema);
  
  // Ensure new row has all columns from schema
  const alignedRow = alignRowToSchema(fullRow, schema);
  const newRowDf = pl.DataFrame([alignedRow]);
  
  // Ensure new row DF has same column order as existing DF
  if (df.height > 0 && df.columns.length > 0) {
    const columnOrder = df.columns;
    const newRowColumns = newRowDf.columns;
    const missingInNewRow = columnOrder.filter((col) => !newRowColumns.includes(col));
    
    // Add missing columns to new row DF (cast to correct type)
    let alignedNewRowDf = newRowDf;
    for (const col of missingInNewRow) {
      const colDef = schema.columns.find((c) => c.id === col);
      if (colDef) {
        const polarsType = getPolarsTypeForSchemaType(colDef.type);
        alignedNewRowDf = alignedNewRowDf.withColumn(pl.lit(null).cast(polarsType).alias(col));
      }
    }
    
    // Reorder new row DF to match existing DF
    alignedNewRowDf = alignedNewRowDf.select(...columnOrder);
    
    // Now vstack should work since schemas match
    df = df.vstack(alignedNewRowDf);
  } else {
    // Empty DataFrame - use new row DF directly
    df = newRowDf;
  }

  // 4. Commit
  await commitDataFrame(tableId, df);
  return fullRow;
}

