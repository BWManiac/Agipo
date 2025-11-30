import pl from "nodejs-polars";
import { TableSchema } from "../../io";
import { getPolarsTypeForSchemaType } from "./types";

/**
 * Aligns a DataFrame to match the current schema by adding missing columns with null values
 * and ensuring correct column order.
 */
export function alignDataFrameToSchema(df: pl.DataFrame, schema: TableSchema): pl.DataFrame {
  // Get all column IDs from schema (in order)
  const schemaColumnIds = schema.columns.map((col) => col.id);
  const existingColumns = df.columns;
  
  // If DataFrame is empty, return as-is (will be handled by new row DF)
  if (df.height === 0) {
    return df;
  }
  
  let alignedDf = df;
  
  // Add missing columns to existing DataFrame (with null values, cast to correct type)
  for (const colId of schemaColumnIds) {
    if (!existingColumns.includes(colId)) {
      const colDef = schema.columns.find((col) => col.id === colId);
      if (colDef) {
        const polarsType = getPolarsTypeForSchemaType(colDef.type);
        // Cast null to the appropriate type so vstack works
        alignedDf = alignedDf.withColumn(pl.lit(null).cast(polarsType).alias(colId));
      }
    }
  }
  
  // Ensure column order matches schema order
  // Select all columns in schema order, plus any extra columns (shouldn't happen, but safe)
  const orderedColumns = schemaColumnIds.filter((colId) => alignedDf.columns.includes(colId));
  const extraColumns = alignedDf.columns.filter((colId) => !schemaColumnIds.includes(colId));
  const finalColumnOrder = [...orderedColumns, ...extraColumns];
  
  if (finalColumnOrder.length > 0) {
    alignedDf = alignedDf.select(...finalColumnOrder);
  }
  
  return alignedDf;
}

/**
 * Ensures a row object has all columns from the schema, filling missing ones with null.
 */
export function alignRowToSchema(row: Record<string, any>, schema: TableSchema): Record<string, any> {
  const alignedRow: Record<string, any> = { ...row };
  const schemaColumnIds = schema.columns.map((col) => col.id);
  
  // Ensure all schema columns are present
  for (const colId of schemaColumnIds) {
    if (!(colId in alignedRow)) {
      alignedRow[colId] = null;
    }
  }
  
  return alignedRow;
}

