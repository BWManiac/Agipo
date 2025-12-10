import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getThreadWithMessages,
  updateThreadTitle,
  deleteThread,
} from "@/app/api/workforce/[agentId]/threads/services/thread-service";

/**
 * GET /api/records/[tableId]/threads/[threadId]
 * Get thread with messages
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ tableId: string; threadId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId, threadId } = await params;
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const resourceId = `${userId}:table:${tableId}`;
    const result = await getThreadWithMessages(agentId, threadId, resourceId);

    if (!result) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Records Thread] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}

/**
 * PATCH /api/records/[tableId]/threads/[threadId]
 * Update thread title
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tableId: string; threadId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId, threadId } = await params;
    const body = await req.json();
    const { title, agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const resourceId = `${userId}:table:${tableId}`;
    const result = await updateThreadTitle(agentId, threadId, resourceId, title);

    if (!result) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ thread: result });
  } catch (error) {
    console.error("[Records Thread] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
  }
}

/**
 * DELETE /api/records/[tableId]/threads/[threadId]
 * Delete thread
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tableId: string; threadId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tableId, threadId } = await params;
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const resourceId = `${userId}:table:${tableId}`;
    const deleted = await deleteThread(agentId, threadId, resourceId);

    if (!deleted) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Records Thread] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}
