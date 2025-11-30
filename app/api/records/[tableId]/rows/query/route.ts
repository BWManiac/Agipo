import { NextResponse } from "next/server";
import { queryTable } from "@/app/api/records/services";

export async function POST(req: Request, routeContext: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await routeContext.params;
    const body = await req.json(); // { filter, sort, limit }
    
    const rows = await queryTable(tableId, body);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

