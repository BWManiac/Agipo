import fs from "fs/promises";
import path from "path";
import { readSchema } from "./io";

const BASE_DIR = path.join(process.cwd(), "_tables", "data");

export type CatalogItem = {
  id: string;
  name: string;
  description?: string;
  recordCount: number;
  lastModified?: string;
};

export async function listTables(): Promise<CatalogItem[]> {
  try {
    const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });
    const tables: CatalogItem[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const tableId = entry.name;
      const schema = await readSchema(tableId);
      
      if (schema) {
        // Quick stats (approximation without loading full DF)
        let recordCount = 0;
        try {
          const stats = await fs.stat(path.join(BASE_DIR, tableId, "records.json"));
          // Very rough heuristic or read file if small. 
          // For MVP, let's read the file size. If < 1MB, load JSON to count.
          if (stats.size < 1024 * 1024) {
             const content = await fs.readFile(path.join(BASE_DIR, tableId, "records.json"), "utf-8");
             const data = JSON.parse(content);
             recordCount = Array.isArray(data) ? data.length : 0;
          }
        } catch {
          // File might not exist yet
        }

        tables.push({
          id: schema.id,
          name: schema.name,
          description: schema.description,
          lastModified: schema.lastModified,
          recordCount,
        });
      }
    }

    return tables;
  } catch (e) {
    console.error("Catalog Error:", e);
    return [];
  }
}

