/**
 * Access API Route
 *
 * GET /api/dox/[docId]/access
 * Get access information for a document.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { readDocument } from "../../services/document-storage";
import { getAgentById } from "@/_tables/agents";

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
    const document = await readDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Extract agent access from properties (stored in frontmatter)
    const agentAccess =
      (document.properties.agentAccess as Array<{
        agentId: string;
        permission: string;
        grantedAt: string;
      }>) || [];

    // Format agent access with agent name lookup
    const agents = agentAccess.map((access) => {
      const agent = getAgentById(access.agentId);
      return {
        id: access.agentId,
        name: agent?.name || access.agentId,
        avatar: agent?.avatar || "",
        permission: access.permission as "read" | "read-write",
        grantedAt: access.grantedAt,
        grantedBy: userId,
      };
    });

    return NextResponse.json({
      agents,
      ragEnabled: document.properties.ragIndexed === true,
      ragLastIndexed: document.properties.ragLastIndexed as string | undefined,
    });
  } catch (error) {
    console.error("[DOX] Get access error:", error);
    return NextResponse.json(
      { error: "Failed to get access information" },
      { status: 500 }
    );
  }
}
