/**
 * Document CRUD API Route
 * 
 * GET /api/dox/[docId] - Read document
 * PATCH /api/dox/[docId] - Update document
 * DELETE /api/dox/[docId] - Delete document
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  readDocument,
  writeDocument,
  deleteDocument,
} from "../services/document-storage";
import { markdownToLexical } from "../services/markdown-parser";
import { generateOutline } from "../services/outline-generator";

const UpdateDocumentSchema = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.properties !== undefined,
    {
      message: "At least one field (title, content, or properties) must be provided",
    }
  );

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

    // Convert Markdown to Lexical state for editor
    const lexicalState = markdownToLexical(document.content);

    // Generate outline from Markdown
    const outline = await generateOutline(document.content);

    return NextResponse.json({
      ...document,
      lexicalState,
      outline,
    });
  } catch (error) {
    console.error("[DOX] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const validated = UpdateDocumentSchema.parse(body);

    // Read existing document
    const existing = await readDocument(docId);
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document
    await writeDocument(docId, {
      title: validated.title,
      content: validated.content,
      properties: validated.properties,
    });

    const updated = await readDocument(docId);
    if (!updated) {
      throw new Error("Failed to read updated document");
    }

    return NextResponse.json({
      id: updated.id,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("[DOX] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId } = await params;

    // Check if document exists
    const existing = await readDocument(docId);
    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await deleteDocument(docId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOX] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
