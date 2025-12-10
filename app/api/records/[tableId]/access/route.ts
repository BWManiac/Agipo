import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { promises as fs } from "fs";
import path from "path";
import { getAgentById, listAgents } from "@/_tables/agents";

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
 * GET /api/records/[tableId]/access
 * Get access list for a table
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
    const accessData = await readAccessFile(tableId);

    // Enrich with agent details
    const agents = accessData.agents
      .map((entry) => {
        const agent = getAgentById(entry.agentId);
        if (!agent) return null;
        return {
          id: entry.agentId,
          name: agent.name,
          role: agent.role || "Assistant",
          avatar: agent.avatar || "🤖",
          permission: entry.permission,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[Records Access] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch access" }, { status: 500 });
  }
}
