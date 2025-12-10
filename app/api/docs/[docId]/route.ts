// API Route: /api/docs/[docId]
// GET - Get single document
// PATCH - Update document
// DELETE - Delete document

import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument, deleteDocument } from "../services";
import { createVersion } from "../services/versions";
import type { UpdateDocumentRequest } from "../services/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

// GET /api/docs/[docId] - Get document
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("[Docs API] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

// PATCH /api/docs/[docId] - Update document
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const body: UpdateDocumentRequest = await request.json();

    // Get existing document first
    const existing = await getDocument(docId);
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Create a version before updating (for significant changes)
    const shouldCreateVersion = body.content !== undefined &&
      body.content !== existing.content;

    if (shouldCreateVersion) {
      await createVersion(docId, existing, {
        type: "user",
        id: "user",
        name: "You",
      });
    }

    const result = await updateDocument(docId, body);

    if (!result) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Docs API] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

// DELETE /api/docs/[docId] - Delete document
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { docId } = await context.params;
    const success = await deleteDocument(docId);

    if (!success) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Docs API] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
