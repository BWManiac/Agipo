/**
 * List Documents API Route
 * 
 * GET /api/dox/list
 * Returns a catalog of all documents for the current user.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  listDocuments,
  readDocument,
} from "../services/document-storage";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docIds = await listDocuments();
    const documents = [];

    // Read each document's frontmatter for catalog
    for (const docId of docIds) {
      const doc = await readDocument(docId);
      if (doc) {
        // Extract excerpt (first 200 chars of content)
        const excerpt = doc.content.slice(0, 200).replace(/\n/g, " ").trim();
        
        documents.push({
          id: doc.id,
          title: doc.title,
          excerpt,
          updatedAt: doc.updatedAt,
        });
      }
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[DOX] List error:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}
