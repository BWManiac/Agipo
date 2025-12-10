import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { promises as fs } from "fs";
import path from "path";

const TABLES_DIR = path.join(process.cwd(), "_tables", "records");

interface ActivityEntry {
  id: string;
  type: "insert" | "update" | "delete";
  actor: {
    type: "user" | "agent" | "workflow";
    id: string;
    name: string;
    avatar?: string;
  };
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

/**
 * GET /api/records/[tableId]/activity
 * Get activity log for a table
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId } = await params;
    const activityData = await readActivityFile(tableId);

    // Return most recent first, limit to 100
    const entries = activityData.entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[Records Activity] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
