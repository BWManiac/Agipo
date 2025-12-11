/**
 * Agent Access API Route
 * 
 * PATCH /api/dox/[docId]/access/agents/[agentId] - Update permission
 * DELETE /api/dox/[docId]/access/agents/[agentId] - Revoke access
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { readDocument, writeDocument } from "../../../../services/document-storage";

const UpdatePermissionSchema = z.object({
  permission: z.enum(["read", "read-write"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ docId: string; agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId, agentId } = await params;
    const body = await request.json();
    const validated = UpdatePermissionSchema.parse(body);

    const document = await readDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const agentAccess = (document.properties.agentAccess as Array<{
      agentId: string;
      permission: string;
      grantedAt: string;
    }>) || [];

    const index = agentAccess.findIndex((a) => a.agentId === agentId);
    if (index === -1) {
      return NextResponse.json(
        { error: "Agent access not found" },
        { status: 404 }
      );
    }

    agentAccess[index].permission = validated.permission;

    await writeDocument(docId, {
      properties: {
        ...document.properties,
        agentAccess,
      },
    });

    return NextResponse.json({
      agentId,
      permission: validated.permission,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("[DOX] Update access error:", error);
    return NextResponse.json(
      { error: "Failed to update access" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ docId: string; agentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { docId, agentId } = await params;

    const document = await readDocument(docId);
    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const agentAccess = (document.properties.agentAccess as Array<{
      agentId: string;
      permission: string;
      grantedAt: string;
    }>) || [];

    const filtered = agentAccess.filter((a) => a.agentId !== agentId);

    await writeDocument(docId, {
      properties: {
        ...document.properties,
        agentAccess: filtered,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DOX] Revoke access error:", error);
    return NextResponse.json(
      { error: "Failed to revoke access" },
      { status: 500 }
    );
  }
}
