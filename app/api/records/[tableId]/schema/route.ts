import { NextResponse } from "next/server";
import { getTableSchema, addColumn } from "@/app/api/records/services";

export async function GET(req: Request, routeContext: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await routeContext.params;
    const schema = await getTableSchema(tableId);
    
    if (!schema) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(schema);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 });
  }
}

export async function PATCH(req: Request, routeContext: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await routeContext.params;
    const body = await req.json();
    
    // Assume body is ColumnInput
    const updatedSchema = await addColumn(tableId, body);
    return NextResponse.json(updatedSchema);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update schema" }, { status: 500 });
  }
}

