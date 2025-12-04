import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgentCustomTools, updateAgentTools } from "@/app/api/workforce/services";

export const runtime = "nodejs";

const UpdateToolsSchema = z.object({
  toolIds: z.array(z.string()),
});

/**
 * GET /api/workforce/[agentId]/tools/custom
 * Returns the custom tool IDs currently assigned to the agent.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const toolIds = getAgentCustomTools(agentId);
    return NextResponse.json({ toolIds });
  } catch (error) {
    console.error("[tools/custom] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve agent tools" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce/[agentId]/tools/custom
 * Updates the custom tool IDs assigned to the agent.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await request.json();
    const { toolIds } = UpdateToolsSchema.parse(body);

    await updateAgentTools(agentId, toolIds);

    return NextResponse.json({ success: true, toolIds });
  } catch (error) {
    console.error("[tools/custom] POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent tools" },
      { status: 500 }
    );
  }
}

