/**
 * Create Document API Route
 * 
 * POST /api/dox/create
 * Creates a new document.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  generateDocId,
  writeDocument,
  readDocument,
} from "../services/document-storage";

const CreateDocumentSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateDocumentSchema.parse(body);

    const docId = generateDocId();
    const now = new Date().toISOString();

    await writeDocument(docId, {
      id: docId,
      title: validated.title || "Untitled Document",
      content: validated.content || "",
      properties: validated.properties || {},
      createdAt: now,
      updatedAt: now,
    });

    const document = await readDocument(docId);
    if (!document) {
      throw new Error("Failed to read created document");
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("[DOX] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
