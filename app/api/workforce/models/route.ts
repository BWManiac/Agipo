import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAvailableModels } from "../services/models";

export const runtime = "nodejs";

/**
 * GET /api/workforce/models
 * Returns all available AI models via Vercel AI Gateway.
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const models = getAvailableModels();

    return NextResponse.json({
      models,
      count: models.length,
    });
  } catch (error) {
    console.error("[API] Failed to fetch models:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch models",
      },
      { status: 500 }
    );
  }
}
