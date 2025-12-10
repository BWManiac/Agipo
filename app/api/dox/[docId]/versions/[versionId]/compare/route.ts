/**
 * Version Compare API Route
 * 
 * GET /api/dox/[docId]/versions/[versionId]/compare
 * Compare two versions.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compareVersions } from "../../../../services/version-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docId: string; versionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId, versionId } = await params;
    const { searchParams } = new URL(request.url);
    const fromVersionId = searchParams.get("from");

    if (!fromVersionId) {
      return NextResponse.json(
        { error: "Missing 'from' query parameter" },
        { status: 400 }
      );
    }

    const comparison = await compareVersions(docId, fromVersionId, versionId);

    if (!comparison) {
      return NextResponse.json(
        { error: "One or both versions not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("[DOX] Compare versions error:", error);
    return NextResponse.json(
      { error: "Failed to compare versions" },
      { status: 500 }
    );
  }
}
