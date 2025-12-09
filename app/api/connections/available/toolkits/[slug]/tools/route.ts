import { NextResponse } from "next/server";
import { getToolsForToolkit } from "../../services/tools";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tools = await getToolsForToolkit(slug);
    return NextResponse.json(tools);
  } catch (error) {
    console.error("[toolkits/[slug]/tools] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get tools" },
      { status: 500 }
    );
  }
}

