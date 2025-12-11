import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { agents } from "@/_tables/agents";
import type { AgentConfig } from "@/_tables/types";

export const runtime = "nodejs";

/**
 * GET /api/workforce
 * Returns all agents in the system.
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return agents from index.ts
    // The index.ts file is automatically updated when agents are created
    const agentConfigs: AgentConfig[] = agents;

    return NextResponse.json({
      agents: agentConfigs,
      count: agentConfigs.length,
    });
  } catch (error) {
    console.error("[API] Failed to fetch agents:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch agents",
      },
      { status: 500 }
    );
  }
}
