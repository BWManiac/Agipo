import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { readWorkflow, writeWorkflow, createEmptyWorkflow } from "@/app/api/workflows-e/services";

export const runtime = "nodejs";

// Schema for creating a new workflow
const CreateWorkflowBodySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * Convert a string to a URL-friendly slug
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique workflow ID
 */
async function ensureUniqueId(preferred: string): Promise<string> {
  let candidate = preferred || nanoid();

  if (!(await readWorkflow(candidate))) {
    return candidate;
  }

  // If exists, append random suffix
  while (true) {
    candidate = `${preferred || "workflow"}-${nanoid(6)}`;
    const existing = await readWorkflow(candidate);
    if (!existing) {
      return candidate;
    }
  }
}

/**
 * POST /api/workflows-e/create
 * Creates a new workflow definition.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWorkflowBodySchema.parse(body);
    
    // Generate unique ID
    const baseSlug = slugify(validated.id ?? validated.name);
    const uniqueId = await ensureUniqueId(baseSlug);
    
    // Create empty workflow with the given name
    const workflow = createEmptyWorkflow(uniqueId, validated.name);
    if (validated.description) {
      workflow.description = validated.description;
    }
    
    // Save to disk
    const saved = await writeWorkflow(workflow);
    
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    
    console.error("API Error: Failed to create workflow:", error);
    return NextResponse.json(
      { message: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

