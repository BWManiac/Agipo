/**
 * Anchor Agent Service
 * Wrapper for Anchor Browser's agent.task() API with step callbacks.
 */

import AnchorBrowser from "anchorbrowser";
import { z } from "zod";

const client = new AnchorBrowser({
  apiKey: process.env.ANCHOR_API_KEY!,
});

export interface AgentStep {
  id: string;
  type: string;
  description: string;
  status: "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface TaskOptions {
  onStep?: (step: AgentStep) => void | Promise<void>;
  outputSchema?: z.ZodSchema;
  timeout?: number;
}

export interface TaskResult {
  success: boolean;
  result: unknown;
  error?: string;
}

/**
 * Execute a natural language task using Anchor's built-in agent
 */
export async function executeAgentTask(
  sessionId: string,
  task: string,
  options?: TaskOptions
): Promise<TaskResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskOptions: any = {
      timeout: options?.timeout || 60000,
    };

    // Add step callback if provided
    if (options?.onStep) {
      taskOptions.onAgentStep = (step: Record<string, unknown>) => {
        const agentStep: AgentStep = {
          id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          type: (step.type as string) || "action",
          description:
            (step.description as string) ||
            (step.action as string) ||
            task,
          status:
            step.status === "completed"
              ? "success"
              : step.status === "failed"
              ? "error"
              : "running",
          timestamp: new Date().toISOString(),
          duration: step.duration as number | undefined,
          error: step.error as string | undefined,
        };

        options.onStep!(agentStep);
      };
    }

    // Add output schema if provided
    if (options?.outputSchema) {
      // Convert Zod schema to JSON schema for Anchor
      const jsonSchema = zodToJsonSchema(options.outputSchema);
      taskOptions.outputSchema = jsonSchema;
    }

    // Execute the task - per docs, sessionId goes directly in options
    const result = await client.agent.task(task, {
      sessionId,
      maxSteps: 40,
      ...taskOptions,
    });

    return {
      success: true,
      result: typeof result === "object" && result !== null && "data" in result
        ? (result as { data: unknown }).data
        : result,
    };
  } catch (error) {
    console.error("Agent task error:", error);
    return {
      success: false,
      result: null,
      error: (error as Error).message,
    };
  }
}

/**
 * Simple Zod to JSON Schema converter
 * Note: This is a basic implementation. For production, use zod-to-json-schema package.
 */
function zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
  // For now, return a basic passthrough
  // The actual implementation would need the zod-to-json-schema package
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (schema as any)._def;
    if (def.typeName === "ZodObject") {
      const shape = def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const field = value as z.ZodTypeAny;
        properties[key] = zodFieldToJson(field);
        if (!field.isOptional()) {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: "object" };
  } catch {
    return { type: "object" };
  }
}

function zodFieldToJson(field: z.ZodTypeAny): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (field as any)._def;
  const typeName = def.typeName;

  switch (typeName) {
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodArray":
      return { type: "array", items: zodFieldToJson(def.type) };
    case "ZodOptional":
      return zodFieldToJson(def.innerType);
    case "ZodNullable":
      return { ...zodFieldToJson(def.innerType), nullable: true };
    default:
      return { type: "string" };
  }
}

// Export the client for direct access if needed
export { client as anchorAgentClient };
