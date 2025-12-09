import { NextResponse } from "next/server";
import { getToolkit } from "../services/tools";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const toolkit = await getToolkit(slug);
    return NextResponse.json(toolkit);
  } catch (error) {
    console.error("[toolkits/[slug]] Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to get toolkit" },
      { status: 500 }
    );
  }
}

