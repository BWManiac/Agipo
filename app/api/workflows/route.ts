import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getWorkflows, getWorkflowById, saveWorkflow } from "@/_tables/workflows";

/**
 * GET /api/workflows
 * Retrieves a list of all saved workflow summaries.
 */
export async function GET() {
  try {
    const workflows = await getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("API Error: Failed to get workflows:", error);
    return NextResponse.json(
      { message: "Failed to retrieve workflows" },
      { status: 500 }
    );
  }
}

// Schema to validate the body of a POST request for creating a workflow.
const CreateWorkflowBodySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  apiKeys: z.record(z.string(), z.string()).optional(),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureUniqueId = async (preferred: string) => {
  let candidate = preferred || nanoid();

  if (!(await getWorkflowById(candidate))) {
    return candidate;
  }

  while (true) {
    candidate = `${preferred || "workflow"}-${nanoid(6)}`;
    const existing = await getWorkflowById(candidate);
    if (!existing) {
      return candidate;
    }
  }
};

/**
 * POST /api/workflows
 * Creates a new workflow.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = CreateWorkflowBodySchema.parse(body);
    const { id: rawId, ...data } = validatedBody;
    const baseSource = rawId ?? data.name;
    const baseSlug = slugify(baseSource);
    const uniqueId = await ensureUniqueId(baseSlug);

    const savedWorkflow = await saveWorkflow(uniqueId, data);
    return NextResponse.json(savedWorkflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("API Error: Failed to save workflow:", error);
    return NextResponse.json(
      { message: "Failed to save workflow" },
      { status: 500 }
    );
  }
}
