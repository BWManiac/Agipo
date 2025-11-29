import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateAgentTools } from "@/app/api/workforce/services";

const UpdateToolsSchema = z.object({
  toolIds: z.array(z.string()),
});

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
    console.error("[agents/tools] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update agent tools" },
      { status: 500 }
    );
  }
}
