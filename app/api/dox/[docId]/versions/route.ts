/**
 * Versions API Route
 * 
 * GET /api/dox/[docId]/versions
 * List all versions for a document.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listVersions } from "../../services/version-manager";

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
    const versions = await listVersions(docId);

    return NextResponse.json({
      versions,
      pagination: {
        offset: 0,
        limit: versions.length,
        total: versions.length,
      },
      autoSaveInterval: 300, // 5 minutes
    });
  } catch (error) {
    console.error("[DOX] Versions list error:", error);
    return NextResponse.json(
      { error: "Failed to list versions" },
      { status: 500 }
    );
  }
}
