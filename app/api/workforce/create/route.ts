import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { createAgent } from "../services/agent-creator";

export const runtime = "nodejs";

// Schema to validate the body of a POST request for creating an agent.
const CreateAgentBodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
  model: z.string().min(1, "Model is required"),
  avatar: z.string().optional().default(""),
  description: z.string().optional().default(""),
  objectives: z.array(z.string()).optional().default([]),
  guardrails: z.array(z.string()).optional().default([]),
  isManager: z.boolean().optional().default(false),
  subAgentIds: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/workforce/create
 * Creates a new agent with folder-based storage structure.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await getAuthUser();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = CreateAgentBodySchema.parse(body);

    const {
      name,
      role,
      systemPrompt,
      model,
      avatar,
      description,
      objectives,
      guardrails,
      isManager,
      subAgentIds,
    } = validatedBody;

    // Create agent (includes rollback on failure)
    const { agentId, folderName } = await createAgent(
      name,
      role,
      systemPrompt,
      model,
      avatar || "",
      description || "",
      objectives || [],
      guardrails || [],
      isManager || false,
      subAgentIds || []
    );

    return NextResponse.json(
      {
        success: true,
        agentId,
        folderName,
        message: "Agent created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request body",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("[API] Failed to create agent:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to create agent",
      },
      { status: 500 }
    );
  }
}
