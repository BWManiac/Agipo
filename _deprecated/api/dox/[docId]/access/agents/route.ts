/**
 * Grant Agent Access API Route
 * 
 * POST /api/dox/[docId]/access/agents
 * Grant an agent access to a document.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { readDocument, writeDocument } from "../../../services/document-storage";

const GrantAccessSchema = z.object({
  agentId: z.string(),
  permission: z.enum(["read", "read-write"]),
});

export async function POST(
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
    const validated = GrantAccessSchema.parse(body);

    const document = await readDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get existing agent access
    const agentAccess = (document.properties.agentAccess as Array<{
      agentId: string;
      permission: string;
      grantedAt: string;
    }>) || [];

    // Add or update access
    const existingIndex = agentAccess.findIndex(
      (a) => a.agentId === validated.agentId
    );
    const newAccess = {
      agentId: validated.agentId,
      permission: validated.permission,
      grantedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      agentAccess[existingIndex] = newAccess;
    } else {
      agentAccess.push(newAccess);
    }

    // Update document properties
    await writeDocument(docId, {
      properties: {
        ...document.properties,
        agentAccess,
      },
    });

    return NextResponse.json({
      agentId: validated.agentId,
      permission: validated.permission,
      grantedAt: newAccess.grantedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("[DOX] Grant access error:", error);
    return NextResponse.json(
      { error: "Failed to grant access" },
      { status: 500 }
    );
  }
}
