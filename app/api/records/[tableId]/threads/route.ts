import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getThreadsForUser,
  createThread,
} from "@/app/api/workforce/[agentId]/threads/services/thread-service";

/**
 * GET /api/records/[tableId]/threads
 * List threads for a table (scoped by agent)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId } = await params;
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    // Use table-scoped resource ID
    const resourceId = `${userId}:table:${tableId}`;
    const threads = await getThreadsForUser(agentId, resourceId);

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("[Records Threads] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }
}

/**
 * POST /api/records/[tableId]/threads
 * Create a new thread for a table
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId } = await params;
    const body = await req.json();
    const { title, agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    // Use table-scoped resource ID
    const resourceId = `${userId}:table:${tableId}`;
    const thread = await createThread(agentId, resourceId, title);

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("[Records Threads] POST error:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
