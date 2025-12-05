import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkingMemory, clearWorkingMemory } from "./services/knowledge-service";

export const runtime = "nodejs";

/**
 * GET /api/workforce/[agentId]/knowledge
 * 
 * Returns the agent's working memory (knowledge) for the authenticated user.
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

    const result = await getWorkingMemory(agentId, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[knowledge] GET error:", error);
    return NextResponse.json(
      { message: "Failed to get knowledge" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workforce/[agentId]/knowledge
 * 
 * Clears all working memory for the authenticated user.
 */
export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await routeContext.params;

    const success = await clearWorkingMemory(agentId, userId);

    if (!success) {
      return NextResponse.json(
        { message: "Failed to clear knowledge" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[knowledge] DELETE error:", error);
    return NextResponse.json(
      { message: "Failed to clear knowledge" },
      { status: 500 }
    );
  }
}

