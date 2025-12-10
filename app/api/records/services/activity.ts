/**
 * Activity Logging Service
 * Logs mutations for audit trail
 */

import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

const TABLES_DIR = path.join(process.cwd(), "_tables", "records");

export interface Actor {
  type: "user" | "agent" | "workflow";
  id: string;
  name: string;
  avatar?: string;
}

export interface ActivityEntry {
  id: string;
  type: "insert" | "update" | "delete";
  actor: Actor;
  rowCount: number;
  columns?: string[];
  timestamp: string;
}

interface ActivityFile {
  entries: ActivityEntry[];
}

async function getActivityFilePath(tableId: string) {
  return path.join(TABLES_DIR, tableId, "activity.json");
}

async function readActivityFile(tableId: string): Promise<ActivityFile> {
  try {
    const filePath = await getActivityFilePath(tableId);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { entries: [] };
  }
}

async function writeActivityFile(tableId: string, data: ActivityFile) {
  const filePath = await getActivityFilePath(tableId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Log an activity entry
 */
export async function logActivity(
  tableId: string,
  type: "insert" | "update" | "delete",
  actor: Actor,
  rowCount: number,
  columns?: string[]
): Promise<void> {
  try {
    const activityData = await readActivityFile(tableId);

    const entry: ActivityEntry = {
      id: nanoid(),
      type,
      actor,
      rowCount,
      columns,
      timestamp: new Date().toISOString(),
    };

    // Add to front (most recent first)
    activityData.entries.unshift(entry);

    // Keep only last 100 entries
    if (activityData.entries.length > 100) {
      activityData.entries = activityData.entries.slice(0, 100);
    }

    await writeActivityFile(tableId, activityData);
  } catch (error) {
    console.error("[Activity] Log failed:", error);
    // Don't throw - activity logging is non-critical
  }
}

/**
 * Get activity entries for a table
 */
export async function getActivity(
  tableId: string,
  limit = 100
): Promise<ActivityEntry[]> {
  const data = await readActivityFile(tableId);
  return data.entries.slice(0, limit);
}
