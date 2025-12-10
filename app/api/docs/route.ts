// API Route: /api/docs
// GET - List all documents
// POST - Create new document

import { NextRequest, NextResponse } from "next/server";
import { listDocuments, createDocument } from "./services";
import type { CreateDocumentRequest } from "./services/types";

export const runtime = "nodejs";

// GET /api/docs - List all documents
export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents, total: documents.length });
  } catch (error) {
    console.error("[Docs API] List error:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// POST /api/docs - Create new document
export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentRequest = await request.json().catch(() => ({}));
    const document = await createDocument(body.title);

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("[Docs API] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
