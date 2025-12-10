// API Route: /api/docs/[docId]/versions
// GET - List all versions
// POST - Create a new version snapshot

import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "../../services";
import { listVersions, createVersion } from "../../services/versions";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

// GET /api/docs/[docId]/versions - List versions
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const versions = await listVersions(docId);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("[Docs API] List versions error:", error);
    return NextResponse.json(
      { error: "Failed to list versions" },
      { status: 500 }
    );
  }
}

// POST /api/docs/[docId]/versions - Create version snapshot
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const body = await request.json().catch(() => ({}));

    const document = await getDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const version = await createVersion(
      docId,
      document,
      body.author || { type: "user", id: "user", name: "You" },
      body.summary
    );

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("[Docs API] Create version error:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
