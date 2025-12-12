/**
 * Documents Route
 *
 * GET  /api/records/documents - List all documents
 * POST /api/records/documents - Create a new document
 */

import { NextRequest, NextResponse } from "next/server";
import { listItemsInFolder } from "../services/catalog";
import { createDocument } from "../services/document-io";
import type { CreateDocumentRequest, DocumentMetadata } from "../types";

/**
 * GET /api/records/documents
 *
 * Query params:
 * - folderId: Filter by folder (null for root)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    // List documents from specified folder (or root)
    const items = await listItemsInFolder(folderId, "document");
    const documents = items.filter(
      (item): item is DocumentMetadata => item.type === "document"
    );

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (e) {
    console.error("[GET /api/records/documents] Error:", e);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records/documents
 *
 * Body:
 * - title: Document title (optional, defaults to "Untitled")
 * - folderId: Folder to create in (optional, defaults to root)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateDocumentRequest;

    const document = await createDocument(body);

    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/records/documents] Error:", e);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
