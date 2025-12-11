import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isValidModelId } from "../chat/services/models";
import {
  updateAgentSystemPrompt,
  updateAgentModel,
  updateAgentMaxSteps,
  updateAgentObjectives,
  updateAgentGuardrails
} from "../../services/agent-config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Await params to get agentId (Next.js 15 requirement)
    const { agentId } = await params;
    
    // Parse body
    const body = await req.json();
    const { systemPrompt, model, maxSteps, objectives, guardrails } = body;

    const updated: string[] = [];
    const errors: string[] = [];

    // Validate and update each field if provided
    if (systemPrompt !== undefined) {
      if (typeof systemPrompt !== "string" || systemPrompt.trim().length < 10) {
        errors.push("systemPrompt: Must be at least 10 characters");
      } else {
        try {
          await updateAgentSystemPrompt(agentId, systemPrompt.trim());
          updated.push("systemPrompt");
        } catch (error: any) {
          errors.push(`systemPrompt: ${error.message}`);
        }
      }
    }

    if (model !== undefined) {
      if (typeof model !== "string" || !isValidModelId(model)) {
        errors.push("model: Invalid model ID");
      } else {
        try {
          await updateAgentModel(agentId, model);
          updated.push("model");
        } catch (error: any) {
          errors.push(`model: ${error.message}`);
        }
      }
    }

    if (maxSteps !== undefined) {
      if (!Number.isInteger(maxSteps) || maxSteps < 1) {
        errors.push("maxSteps: Must be a positive integer");
      } else {
        try {
          await updateAgentMaxSteps(agentId, maxSteps);
          updated.push("maxSteps");
        } catch (error: any) {
          errors.push(`maxSteps: ${error.message}`);
        }
      }
    }

    if (objectives !== undefined) {
      if (!Array.isArray(objectives) || !objectives.every(obj => typeof obj === "string")) {
        errors.push("objectives: Must be an array of strings");
      } else {
        try {
          await updateAgentObjectives(agentId, objectives);
          updated.push("objectives");
        } catch (error: any) {
          errors.push(`objectives: ${error.message}`);
        }
      }
    }

    if (guardrails !== undefined) {
      if (!Array.isArray(guardrails) || !guardrails.every(gr => typeof gr === "string")) {
        errors.push("guardrails: Must be an array of strings");
      } else {
        try {
          await updateAgentGuardrails(agentId, guardrails);
          updated.push("guardrails");
        } catch (error: any) {
          errors.push(`guardrails: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: updated.length > 0,
      updated,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("[config] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 }
    );
  }
}