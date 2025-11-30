import { NextResponse } from "next/server";
import { insertRow } from "@/app/api/records/services";

export async function POST(req: Request, routeContext: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await routeContext.params;
    const body = await req.json();
    
    const row = await insertRow(tableId, body);
    return NextResponse.json(row);
  } catch (error) {
    console.error("Insert Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Insert failed" }, { status: 400 });
  }
}

