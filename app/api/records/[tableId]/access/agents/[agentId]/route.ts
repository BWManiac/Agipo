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
 * PATCH /api/records/[tableId]/access/agents/[agentId]
 * Update agent permission
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tableId: string; agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId, agentId } = await params;
    const body = await req.json();
    const { permission } = body;

    if (!permission || !["read", "read_write"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
    }

    const accessData = await readAccessFile(tableId);
    const entryIndex = accessData.agents.findIndex((a) => a.agentId === agentId);

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    accessData.agents[entryIndex].permission = permission;
    await writeAccessFile(tableId, accessData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Records Access] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
}

/**
 * DELETE /api/records/[tableId]/access/agents/[agentId]
 * Revoke agent access
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tableId: string; agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId, agentId } = await params;

    const accessData = await readAccessFile(tableId);
    const entryIndex = accessData.agents.findIndex((a) => a.agentId === agentId);

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    accessData.agents.splice(entryIndex, 1);
    await writeAccessFile(tableId, accessData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Records Access] DELETE error:", error);
    return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 });
  }
}
