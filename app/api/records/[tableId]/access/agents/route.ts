import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { promises as fs } from "fs";
import path from "path";

const TABLES_DIR = path.join(process.cwd(), "_tables", "records");

interface AccessEntry {
  agentId: string;
  permission: "read" | "read_write";
  grantedAt: string;
}

interface AccessFile {
  agents: AccessEntry[];
}

async function getAccessFilePath(tableId: string) {
  return path.join(TABLES_DIR, tableId, "access.json");
}

async function readAccessFile(tableId: string): Promise<AccessFile> {
  try {
    const filePath = await getAccessFilePath(tableId);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { agents: [] };
  }
}

async function writeAccessFile(tableId: string, data: AccessFile) {
  const filePath = await getAccessFilePath(tableId);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * POST /api/records/[tableId]/access/agents
 * Grant agent access to table
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId } = await params;
    const body = await req.json();
    const { agentId, permission = "read_write" } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const accessData = await readAccessFile(tableId);

    // Check if already exists
    const existing = accessData.agents.find((a) => a.agentId === agentId);
    if (existing) {
      return NextResponse.json({ error: "Agent already has access" }, { status: 400 });
    }

    // Add new entry
    accessData.agents.push({
      agentId,
      permission,
      grantedAt: new Date().toISOString(),
    });

    await writeAccessFile(tableId, accessData);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Records Access] POST error:", error);
    return NextResponse.json({ error: "Failed to grant access" }, { status: 500 });
  }
}
