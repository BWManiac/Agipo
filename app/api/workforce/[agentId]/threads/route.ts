import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getThreadsForUser, createThread } from "./services/thread-service";

export const runtime = "nodejs";

/**
 * GET /api/workforce/[agentId]/threads
 * 
 * Lists all threads for the authenticated user and specified agent.
 * Threads are sorted by updatedAt descending (most recent first).
 */
export async function GET(
  _request: Request,
  routeContext: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await routeContext.params;

    const threads = await getThreadsForUser(agentId, userId);

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("[threads] GET error:", error);
    return NextResponse.json(
      { message: "Failed to list threads" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce/[agentId]/threads
 * 
 * Creates a new thread for the authenticated user.
 * Body: { title?: string }
 */
export async function POST(
  request: Request,
  routeContext: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await routeContext.params;
    const body = await request.json().catch(() => ({}));
    const title = body.title as string | undefined;

    const thread = await createThread(agentId, userId, title);

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("[threads] POST error:", error);
    return NextResponse.json(
      { message: "Failed to create thread" },
      { status: 500 }
    );
  }
}

