/**
 * Table Instance Route
 *
 * GET    /api/records/[tableId] - Get table metadata
 * DELETE /api/records/[tableId] - Delete table
 */

import { NextRequest, NextResponse } from "next/server";
import { readSchema } from "../services/io";
import { deleteTable } from "../services/mutation/delete";

interface RouteContext {
  params: Promise<{ tableId: string }>;
}

/**
 * GET /api/records/[tableId]
 * Returns table metadata (schema)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { tableId } = await context.params;
  console.log(`[GET /api/records/${tableId}] Fetching table metadata`);

  try {
    const schema = await readSchema(tableId);

    if (!schema) {
      console.warn(`[GET /api/records/${tableId}] Table not found`);
      return NextResponse.json(
        { error: "Table not found", tableId },
        { status: 404 }
      );
    }

    return NextResponse.json({ table: schema });
  } catch (error) {
    console.error(`[GET /api/records/${tableId}] Error:`, error);
    return NextResponse.json(
      {
        error: "Failed to fetch table",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/records/[tableId]
 * Deletes a table and all its data
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { tableId } = await context.params;
  console.log(`[DELETE /api/records/${tableId}] Deleting table`);

  try {
    const deleted = await deleteTable(tableId);

    if (!deleted) {
      console.warn(`[DELETE /api/records/${tableId}] Table not found`);
      return NextResponse.json(
        { error: "Table not found", tableId },
        { status: 404 }
      );
    }

    console.log(`[DELETE /api/records/${tableId}] Table deleted successfully`);
    return NextResponse.json({ success: true, tableId });
  } catch (error) {
    console.error(`[DELETE /api/records/${tableId}] Error:`, error);
    return NextResponse.json(
      {
        error: "Failed to delete table",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
