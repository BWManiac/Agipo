/**
 * Document Instance Route
 *
 * GET    /api/records/documents/[docId] - Get document
 * PUT    /api/records/documents/[docId] - Update document
 * DELETE /api/records/documents/[docId] - Delete document
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "../../services/document-io";
import type { UpdateDocumentRequest } from "../../types";

interface Params {
  params: Promise<{ docId: string }>;
}

/**
 * GET /api/records/documents/[docId]
 *
 * Returns document with frontmatter and content
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const document = await getDocument(docId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (e) {
    console.error("[GET /api/records/documents/[docId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/records/documents/[docId]
 *
 * Body:
 * - content: New content (can include frontmatter)
 * - title: New title
 * - description: New description
 * - tags: New tags array
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const body = (await request.json()) as UpdateDocumentRequest;

    const result = await updateDocument(docId, body);

    if (!result) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[PUT /api/records/documents/[docId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/documents/[docId]
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { docId } = await params;
    const success = await deleteDocument(docId);

    if (!success) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/records/documents/[docId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
