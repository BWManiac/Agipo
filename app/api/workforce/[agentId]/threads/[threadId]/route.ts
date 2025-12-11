import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getThreadWithMessages,
  updateThreadTitle,
  deleteThread,
} from "../services/thread-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ agentId: string; threadId: string }>;
};

/**
 * GET /api/workforce/[agentId]/threads/[threadId]
 * 
 * Gets a specific thread with its messages.
 * Returns 404 if thread doesn't exist or doesn't belong to user.
 */
export async function GET(_request: Request, routeContext: RouteContext) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId, threadId } = await routeContext.params;

    const result = await getThreadWithMessages(agentId, threadId, userId);

    if (!result) {
      return NextResponse.json({ message: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[threads/[id]] GET error:", error);
    return NextResponse.json(
      { message: "Failed to get thread" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workforce/[agentId]/threads/[threadId]
 * 
 * Updates thread title.
 * Body: { title: string }
 */
export async function PATCH(request: Request, routeContext: RouteContext) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId, threadId } = await routeContext.params;
    const body = await request.json();
    const title = body.title as string;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    const thread = await updateThreadTitle(agentId, threadId, userId, title);

    if (!thread) {
      return NextResponse.json({ message: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("[threads/[id]] PATCH error:", error);
    return NextResponse.json(
      { message: "Failed to update thread" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workforce/[agentId]/threads/[threadId]
 * 
 * Deletes a thread and all its messages.
 * Returns 404 if thread doesn't exist or doesn't belong to user.
 */
export async function DELETE(_request: Request, routeContext: RouteContext) {
  try {
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId, threadId } = await routeContext.params;

    const success = await deleteThread(agentId, threadId, userId);

    if (!success) {
      return NextResponse.json({ message: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[threads/[id]] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to delete thread" },
      { status: 500 }
    );
  }
}

