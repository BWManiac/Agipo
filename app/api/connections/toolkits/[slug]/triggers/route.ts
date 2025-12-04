import { NextResponse } from "next/server";
import { getTriggersForToolkit } from "../../../services/composio";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const triggers = await getTriggersForToolkit(slug);
    return NextResponse.json(triggers);
  } catch (error) {
    console.error("[toolkits/[slug]/triggers] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get triggers" },
      { status: 500 }
    );
  }
}

