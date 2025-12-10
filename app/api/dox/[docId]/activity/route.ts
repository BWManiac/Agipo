/**
 * Activity API Route
 * 
 * GET /api/dox/[docId]/activity
 * Get activity log for a document.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { readDocument } from "../../services/document-storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const document = await readDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // TODO: Load from activity.json file or generate from versions
    // For Phase 7, return empty array
    const activities: Array<{
      id: string;
      type: string;
      actor: { type: string; id: string; name: string; avatar?: string };
      timestamp: string;
      summary: string;
    }> = [];

    const filtered =
      filter === "all"
        ? activities
        : activities.filter((a) => a.actor.type === filter);

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginated,
      pagination: {
        offset,
        limit,
        total: filtered.length,
        hasMore: offset + limit < filtered.length,
      },
    });
  } catch (error) {
    console.error("[DOX] Get activity error:", error);
    return NextResponse.json(
      { error: "Failed to get activity log" },
      { status: 500 }
    );
  }
}
