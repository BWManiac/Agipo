import pl from "nodejs-polars";
import { getDataFrame } from "./io";

export type QueryFilter = {
  col: string;
  op: "eq" | "neq" | "gt" | "lt" | "contains";
  val: any;
};

export type QuerySort = {
  col: string;
  desc?: boolean;
};

export type QueryOptions = {
  filter?: QueryFilter;
  sort?: QuerySort;
  limit?: number;
  offset?: number;
};

export async function queryTable(tableId: string, options: QueryOptions = {}) {
  let df = await getDataFrame(tableId);

  // 1. Filter
  if (options.filter) {
    const { col, op, val } = options.filter;
    
    // Basic ops mapping
    if (op === "eq") df = df.filter(pl.col(col).eq(pl.lit(val)));
    else if (op === "neq") df = df.filter(pl.col(col).neq(pl.lit(val)));
    else if (op === "gt") df = df.filter(pl.col(col).gt(pl.lit(val)));
    else if (op === "lt") df = df.filter(pl.col(col).lt(pl.lit(val)));
    else if (op === "contains") {
      // String contains
      df = df.filter(pl.col(col).str.contains(val));
    }
  }

  // 2. Sort
  if (options.sort) {
    df = df.sort(options.sort.col, options.sort.desc ?? false);
  }

  // 3. Pagination
  // Polars slice is (offset, length)
  if (options.limit || options.offset) {
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    df = df.slice(offset, limit);
  }

  // Return as JSON objects
  return df.toRecords();
}

