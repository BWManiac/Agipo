import { NextResponse } from "next/server";
import { listWorkflows } from "../services/storage";

export async function GET() {
  try {
    const workflows = await listWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error listing workflows:", error);
    return NextResponse.json(
      { error: "Failed to list workflows" },
      { status: 500 }
    );
  }
}




