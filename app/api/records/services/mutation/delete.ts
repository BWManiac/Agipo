import pl from "nodejs-polars";
import { getDataFrame, commitDataFrame } from "../io";

export async function deleteRow(tableId: string, rowId: string) {
  let df = await getDataFrame(tableId);
  
  const initialCount = df.height;
  df = df.filter(pl.col("id").neq(pl.lit(rowId)));
  
  if (df.height === initialCount) {
    throw new Error("Row not found");
  }

  await commitDataFrame(tableId, df);
}

