import { NextResponse } from "next/server";
import { listTables } from "../services";

export async function GET() {
  try {
    const tables = await listTables();
    return NextResponse.json(tables);
  } catch (error) {
    return NextResponse.json({ error: "Failed to list tables" }, { status: 500 });
  }
}

