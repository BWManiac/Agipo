/**
 * Activity API Route
 *
 * GET /api/dox/[docId]/activity
 * Get activity log for a document.
 *
 * Activity is derived from version history - each version creates an "edit" activity.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { readDocument } from "../../services/document-storage";
import { listVersions } from "../../services/version-manager";

interface Activity {
  id: string;
  type: "created" | "edited" | "restored" | "agent_edited";
  actor: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  summary: string;
  metadata?: {
    versionId?: string;
    wordsDelta?: number;
  };
}

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

    // Generate activity from version history
    const versions = await listVersions(docId);
    const activities: Activity[] = versions.map((version, index) => {
      const isFirst = index === versions.length - 1; // Oldest version
      const isAgentEdit = version.createdBy.type === "agent";

      // Determine activity type
      let type: Activity["type"];
      if (isFirst) {
        type = "created";
      } else if (isAgentEdit) {
        type = "agent_edited";
      } else {
        type = "edited";
      }

      // Generate summary based on word delta
      let summary: string;
      if (isFirst) {
        summary = "Created document";
      } else if (version.wordsDelta > 0) {
        summary = `Added ${version.wordsDelta} words`;
      } else if (version.wordsDelta < 0) {
        summary = `Removed ${Math.abs(version.wordsDelta)} words`;
      } else {
        summary = "Made changes";
      }

      return {
        id: `activity-${version.id}`,
        type,
        actor: version.createdBy,
        timestamp: version.createdAt,
        summary,
        metadata: {
          versionId: version.id,
          wordsDelta: version.wordsDelta,
        },
      };
    });

    // Apply filter
    const filtered =
      filter === "all"
        ? activities
        : activities.filter((a) => a.actor.type === filter);

    // Apply pagination
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
