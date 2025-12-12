/**
 * Move Item Route
 *
 * PATCH /api/records/items/[itemId]/move - Move an item to a different folder
 */

import { NextRequest, NextResponse } from "next/server";
import { moveItem, folderExists } from "../../../services/folders";
import type { MoveItemRequest } from "../../../types";

interface Params {
  params: Promise<{ itemId: string }>;
}

/**
 * PATCH /api/records/items/[itemId]/move
 *
 * Body:
 * - targetFolderId: Destination folder ID (null for root)
 *
 * Query params:
 * - type: Item type (table or document) - required
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("type") as "table" | "document" | null;

    if (!itemType || !["table", "document"].includes(itemType)) {
      return NextResponse.json(
        { error: "Item type (table or document) is required as query param" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as MoveItemRequest;
    const targetFolderId = body.targetFolderId;

    // Validate target folder exists (if not root)
    if (targetFolderId !== null) {
      const exists = await folderExists(targetFolderId);
      if (!exists) {
        return NextResponse.json(
          { error: "Target folder not found" },
          { status: 404 }
        );
      }
    }

    const success = await moveItem(itemId, itemType, targetFolderId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to move item. Item may not exist." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      itemId,
      targetFolderId,
    });
  } catch (e) {
    console.error("[PATCH /api/records/items/[itemId]/move] Error:", e);
    return NextResponse.json(
      { error: "Failed to move item" },
      { status: 500 }
    );
  }
}
