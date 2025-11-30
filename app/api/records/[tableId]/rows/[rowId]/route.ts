import { NextResponse } from "next/server";
import { updateRow, deleteRow } from "@/app/api/records/services";

export async function PATCH(req: Request, routeContext: { params: Promise<{ tableId: string; rowId: string }> }) {
  try {
    const { tableId, rowId } = await routeContext.params;
    const body = await req.json();
    
    const updated = await updateRow(tableId, rowId, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, routeContext: { params: Promise<{ tableId: string; rowId: string }> }) {
  try {
    const { tableId, rowId } = await routeContext.params;
    await deleteRow(tableId, rowId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

