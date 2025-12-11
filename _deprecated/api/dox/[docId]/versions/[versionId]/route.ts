/**
 * Version API Route
 * 
 * GET /api/dox/[docId]/versions/[versionId] - Get version details
 * POST /api/dox/[docId]/versions/[versionId] - Restore version
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getVersion, restoreVersion } from "../../../services/version-manager";

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
    const version = await getVersion(docId, versionId);

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("[DOX] Get version error:", error);
    return NextResponse.json(
      { error: "Failed to get version" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ docId: string; versionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId, versionId } = await params;
    const newVersion = await restoreVersion(docId, versionId, {
      type: "user",
      id: userId,
      name: "User",
    });

    return NextResponse.json({
      newVersionId: newVersion.id,
      restoredFrom: versionId,
      content: newVersion.content,
      updatedAt: newVersion.createdAt,
    });
  } catch (error) {
    console.error("[DOX] Restore version error:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
