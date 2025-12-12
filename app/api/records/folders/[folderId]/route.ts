/**
 * Folder Instance Route
 *
 * GET    /api/records/folders/[folderId] - Get folder details
 * PATCH  /api/records/folders/[folderId] - Update folder
 * DELETE /api/records/folders/[folderId] - Delete folder
 */

import { NextRequest, NextResponse } from "next/server";
import { getFolder, updateFolder, deleteFolder } from "../../services/folders";
import type { UpdateFolderRequest } from "../../types";

interface Params {
  params: Promise<{ folderId: string }>;
}

/**
 * GET /api/records/folders/[folderId]
 *
 * Returns folder metadata and breadcrumb path
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { folderId } = await params;
    const folder = await getFolder(folderId);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (e) {
    console.error("[GET /api/records/folders/[folderId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to get folder" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/records/folders/[folderId]
 *
 * Body:
 * - name: New folder name (optional)
 * - color: New folder color (optional)
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { folderId } = await params;
    const body = (await request.json()) as UpdateFolderRequest;

    const folder = await updateFolder(folderId, body);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ folder });
  } catch (e) {
    console.error("[PATCH /api/records/folders/[folderId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/folders/[folderId]
 *
 * Deletes folder and all contents (tables, documents, subfolders)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { folderId } = await params;
    const success = await deleteFolder(folderId);

    if (!success) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/records/folders/[folderId]] Error:", e);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
