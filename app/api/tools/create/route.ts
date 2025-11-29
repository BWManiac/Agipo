import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getToolDefinition, saveToolDefinition, saveToolExecutable, transpileWorkflowToTool } from "@/app/api/tools/services";

export const runtime = "nodejs";

// Schema to validate the body of a POST request for creating a tool definition.
const CreateToolDefinitionBodySchema = z.object({
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

  if (!(await getToolDefinition(candidate))) {
    return candidate;
  }

  while (true) {
    candidate = `${preferred || "tool"}-${nanoid(6)}`;
    const existing = await getToolDefinition(candidate);
    if (!existing) {
      return candidate;
    }
  }
};

/**
 * POST /api/tools/create
 * Creates a new tool definition (workflow).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedBody = CreateToolDefinitionBodySchema.parse(body);
    const { id: rawId, ...data } = validatedBody;
    const baseSource = rawId ?? data.name;
    const baseSlug = slugify(baseSource);
    const uniqueId = await ensureUniqueId(baseSlug);

    const savedWorkflow = await saveToolDefinition(uniqueId, data);

    // Transpile and save tool executable
    try {
      const toolCode = await transpileWorkflowToTool(savedWorkflow);
      await saveToolExecutable(uniqueId, toolCode);
    } catch (transpileError) {
      console.warn(
        `[API] Failed to transpile tool for definition ${uniqueId}:`,
        transpileError
      );
      // Don't fail the request, just log the warning
    }

    return NextResponse.json(savedWorkflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request body", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("API Error: Failed to save tool definition:", error);
    return NextResponse.json(
      { message: "Failed to save tool definition" },
      { status: 500 }
    );
  }
}

