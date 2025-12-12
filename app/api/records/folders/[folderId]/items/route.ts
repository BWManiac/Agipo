/**
 * Folder Items Route
 *
 * GET /api/records/folders/[folderId]/items - List all items in a folder
 */

import { NextRequest, NextResponse } from "next/server";
import { getFolder, getBreadcrumbs, folderExists } from "../../../services/folders";
import { listItemsInFolder } from "../../../services/catalog";
import type { FolderContents } from "../../../types";

interface Params {
  params: Promise<{ folderId: string }>;
}

/**
 * GET /api/records/folders/[folderId]/items
 *
 * Returns folder contents including:
 * - Folder metadata
 * - Items (subfolders, tables, documents)
 * - Breadcrumb navigation
 *
 * Query params:
 * - type: Filter by item type (table, document, folder)
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") as
      | "table"
      | "document"
      | "folder"
      | null;

    // Handle root folder (folderId = "_root" or special handling)
    const isRoot = folderId === "_root";
    const actualFolderId = isRoot ? null : folderId;

    // Get folder metadata (null for root)
    let folder = null;
    if (!isRoot) {
      folder = await getFolder(folderId);
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    }

    // Get items in folder
    const items = await listItemsInFolder(actualFolderId, typeFilter);

    // Get breadcrumbs
    const breadcrumbs = await getBreadcrumbs(actualFolderId);

    const response: FolderContents = {
      folder,
      items,
      breadcrumbs,
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error("[GET /api/records/folders/[folderId]/items] Error:", e);
    return NextResponse.json(
      { error: "Failed to list folder items" },
      { status: 500 }
    );
  }
}
