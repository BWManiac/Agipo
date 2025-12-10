// API Route: /api/docs/[docId]/versions/[versionId]
// GET - Get version content
// POST - Restore this version

import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument } from "../../../services";
import { getVersion, createVersion } from "../../../services/versions";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ docId: string; versionId: string }>;
}

// GET /api/docs/[docId]/versions/[versionId] - Get version
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId, versionId } = await context.params;
    const version = await getVersion(docId, versionId);

    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document: version });
  } catch (error) {
    console.error("[Docs API] Get version error:", error);
    return NextResponse.json(
      { error: "Failed to get version" },
      { status: 500 }
    );
  }
}

// POST /api/docs/[docId]/versions/[versionId]/restore - Restore version
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { docId, versionId } = await context.params;

    // Get current document to backup
    const currentDoc = await getDocument(docId);
    if (!currentDoc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get the version to restore
    const versionDoc = await getVersion(docId, versionId);
    if (!versionDoc) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Create backup of current state before restore
    await createVersion(docId, currentDoc, {
      type: "user",
      id: "user",
      name: "You",
    }, `Backup before restore from ${versionId}`);

    // Restore the version
    const result = await updateDocument(docId, {
      content: versionDoc.content,
      title: versionDoc.frontmatter.title,
      tags: versionDoc.frontmatter.tags,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to restore version" },
        { status: 500 }
      );
    }

    // Create a version entry for the restore
    const newVersion = await createVersion(docId, result.document, {
      type: "user",
      id: "user",
      name: "You",
    }, `Restored from ${versionId}`);

    return NextResponse.json({
      document: result.document,
      newVersion,
    });
  } catch (error) {
    console.error("[Docs API] Restore version error:", error);
    return NextResponse.json(
      { error: "Failed to restore version" },
      { status: 500 }
    );
  }
}
