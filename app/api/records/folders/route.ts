/**
 * Folders Route
 *
 * GET  /api/records/folders - List folders (optionally filtered by parent)
 * POST /api/records/folders - Create a new folder
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listFoldersInParent,
  createFolder,
  buildFolderTree,
} from "../services/folders";
import type { CreateFolderRequest } from "../types";

/**
 * GET /api/records/folders
 *
 * Query params:
 * - parentId: Filter by parent folder (null for root-level folders)
 * - tree: If "true", return full folder tree instead of flat list
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const tree = searchParams.get("tree") === "true";

    if (tree) {
      // Return full folder tree for sidebar
      const folderTree = await buildFolderTree();
      return NextResponse.json({ tree: folderTree });
    }

    // Return flat list filtered by parent
    const folders = await listFoldersInParent(parentId);
    return NextResponse.json({ folders });
  } catch (e) {
    console.error("[GET /api/records/folders] Error:", e);
    return NextResponse.json(
      { error: "Failed to list folders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/records/folders
 *
 * Body:
 * - name: Folder name (required)
 * - parentId: Parent folder ID (optional, null for root)
 * - color: Folder color (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateFolderRequest;

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const folder = await createFolder(body);

    return NextResponse.json({ folder }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/records/folders] Error:", e);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
