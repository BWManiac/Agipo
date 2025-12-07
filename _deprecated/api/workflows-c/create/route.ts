import { NextRequest, NextResponse } from "next/server";
import { createWorkflow } from "../services/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name as string | undefined;

    const workflow = await createWorkflow(name);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}




