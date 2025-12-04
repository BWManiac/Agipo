import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAgentConnectionToolBindings,
  updateConnectionToolBindings,
} from "@/app/api/workforce/services";
import type { ConnectionToolBinding } from "@/_tables/types";

export const runtime = "nodejs";

const ConnectionToolBindingSchema = z.object({
  toolId: z.string(),
  connectionId: z.string(),
  toolkitSlug: z.string(),
});

const UpdateBindingsSchema = z.object({
  bindings: z.array(ConnectionToolBindingSchema),
});

/**
 * GET /api/workforce/[agentId]/tools/connection
 * Returns the connection tool bindings currently assigned to the agent.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const bindings = getAgentConnectionToolBindings(agentId);
    return NextResponse.json({ bindings });
  } catch (error) {
    console.error("[tools/connection] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve agent connection tools" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce/[agentId]/tools/connection
 * Updates the connection tool bindings assigned to the agent.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await request.json();
    const { bindings } = UpdateBindingsSchema.parse(body);

    await updateConnectionToolBindings(agentId, bindings as ConnectionToolBinding[]);

    return NextResponse.json({ success: true, bindings });
  } catch (error) {
    console.error("[tools/connection] POST Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update agent connection tools",
      },
      { status: 500 }
    );
  }
}

