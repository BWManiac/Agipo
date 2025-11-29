/**
 * EXAMPLE TRANSPILED WORKFLOW TOOL
 * =================================
 * 
 * This file represents what we want the transpiler to generate from a workflow.
 * It's based on the "Score Applications" node from yc-2.json, but shows how
 * a complete workflow could be compiled into a single tool file.
 * 
 * Key characteristics:
 * - Zod schemas generated from node specs
 * - Deterministic function signatures with inferred types
 * - User's TypeScript/JavaScript code wrapped in typed functions
 * - Edge mappings respected in execution
 * - Ready to be used as an agent tool
 * 
 * NOTE: Users write TypeScript/JavaScript code directly in the workflow editor.
 * No language translation is needed - the transpiler injects their code as-is
 * into the typed wrapper functions.
 */

import { z } from "zod";
import { tool } from "ai";
import type { ToolDefinition } from "@/_tables/types";

// ============================================================================
// SCHEMA GENERATION (from node.data.spec)
// ============================================================================

/**
 * Generated from: node "Score Applications" (id: "clnd")
 * Input schema derived from spec.inputs
 */
const ScoreApplications_InputSchema = z.object({
  applications: z
    .array(z.record(z.string(), z.unknown()))
    .describe("The list of applications to score."),
});

/**
 * Generated from: node "Score Applications" (id: "clnd")
 * Output schema derived from spec.outputs
 */
const ScoreApplications_OutputSchema = z.object({
  scored_applications: z
    .array(z.record(z.string(), z.unknown()))
    .describe("The list of applications, with an added score."),
});

// Type inference for deterministic signatures
type ScoreApplications_Input = z.infer<typeof ScoreApplications_InputSchema>;
type ScoreApplications_Output = z.infer<typeof ScoreApplications_OutputSchema>;

// ============================================================================
// USER CODE WRAPPER
// ============================================================================

/**
 * Wraps the user's code from node.data.code
 * The user writes TypeScript/JavaScript code directly, which is injected here
 * and constrained to use only the typed inputs.
 */
async function scoreApplicationsNode(
  input: ScoreApplications_Input
): Promise<ScoreApplications_Output> {
  // Validate input against schema
  const validatedInput = ScoreApplications_InputSchema.parse(input);
  
  // Extract typed inputs (user code can only access these)
  const { applications } = validatedInput;
  
  // ========================================================================
  // USER'S CODE (from node.data.code) - injected here
  // ========================================================================
  // The user writes TypeScript/JavaScript code in the workflow editor.
  // Example of what they might write:
  //   const scored_applications: Array<Record<string, unknown>> = [];
  //   for (const app of applications) {
  //     let score = 0;
  //     if (String(app.description || "").includes("AI")) {
  //       score += 30;
  //     }
  //     // ... more scoring logic
  //     scored_applications.push({ ...app, score });
  //   }
  //   return { scored_applications };
  
  const scored_applications: Array<Record<string, unknown>> = [];
  
  for (const app of applications) {
    let score = 0;
    
    // Example scoring logic (from user's code)
    const description = String(app.description || "");
    if (description.includes("AI")) {
      score += 30;
    }
    if (description.includes("SaaS")) {
      score += 20;
    }
    const teamSize = Number(app.team_size || 0);
    if (teamSize > 5) {
      score += 25;
    }
    const marketSize = Number(app.market_size || 0);
    if (marketSize > 1000000000) {
      score += 25;
    }
    
    // Add score to application
    scored_applications.push({
      ...app,
      score,
    });
  }
  
  // ========================================================================
  // END USER CODE
  // ========================================================================
  
  // Validate output against schema
  const result: ScoreApplications_Output = {
    scored_applications,
  };
  
  return ScoreApplications_OutputSchema.parse(result);
}

// ============================================================================
// WORKFLOW COMPOSITION (if multiple nodes)
// ============================================================================

/**
 * For a multi-node workflow, we'd compose them respecting edge mappings.
 * This example shows a simplified version - the full implementation would
 * use the EdgeMapping records to route data between nodes.
 */
async function executeWorkflowChain(input: {
  keywords?: string[];
  reviewers?: string[];
  minScoreThreshold?: number;
}): Promise<Record<string, unknown>> {
  // Step 1: Get New Applications (no inputs)
  const step1Result = await getNewApplicationsNode();
  
  // Step 2: Filter by Keywords (uses step1 output via edge mapping)
  const step2Result = await filterByKeywordsNode({
    applications: step1Result.applications,
    keywords: input.keywords || ["AI", "SaaS"], // From tool input or edge mapping static values
  });
  
  // Step 3: Score Applications (uses step2 output)
  const step3Result = await scoreApplicationsNode({
    applications: step2Result.filtered_applications,
  });
  
  // Step 4: Select Top Applications (uses step3 output)
  const step4Result = await selectTopApplicationsNode({
    scored_applications: step3Result.scored_applications,
    minScoreThreshold: input.minScoreThreshold || 50,
  });
  
  // Step 5: Assign for Review (uses step4 output + static reviewers)
  const step5Result = await assignForReviewNode({
    top_applications: step4Result.top_applications,
    reviewers: input.reviewers || ["reviewer1", "reviewer2"], // From tool input or edge mapping
  });
  
  return step5Result;
}

// ============================================================================
// AGENT TOOL EXPORT (Vercel AI SDK Compatible)
// ============================================================================

/**
 * Tool instance for Vercel AI SDK.
 * 
 * IMPORTANT: The tool() function does NOT accept id/name - those go in the
 * ToolDefinition wrapper. This matches the pattern used in _tables/tools/*.ts
 * 
 * Reference: https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk
 */
export const ycApplicationScoringTool = tool({
  description:
    "Scores YC startup applications based on team experience, market size, and product traction. " +
    "Filters applications by keywords, calculates scores, selects top candidates, and assigns them to reviewers. " +
    "Use this tool when you need to process and evaluate a batch of startup applications.",
  
  // Input schema for the entire workflow
  // The model will see these fields and their descriptions when deciding to call this tool
  inputSchema: z.object({
    keywords: z
      .array(z.string())
      .optional()
      .describe("Keywords to filter applications by (e.g., ['AI', 'SaaS']). If not provided, all applications are scored."),
    reviewers: z
      .array(z.string())
      .optional()
      .describe("List of reviewer names or IDs for assignment. If not provided, uses default reviewers."),
    minScoreThreshold: z
      .number()
      .optional()
      .describe("Minimum score threshold for selecting top applications. Defaults to 50 if not specified."),
  }),
  
  // Execute function that runs the workflow
  // The AI SDK automatically validates input against inputSchema before calling this
  execute: async (input: {
    keywords?: string[];
    reviewers?: string[];
    minScoreThreshold?: number;
  }): Promise<Record<string, unknown>> => {
    // The workflow execution:
    // 1. Input is already validated by the AI SDK against inputSchema
    // 2. Execute nodes in order (respecting edge mappings)
    // 3. Return final output (must be JSON-serializable)
    
    const result = await executeWorkflowChain(input);
    return result;
  },
});

// ============================================================================
// TOOL DEFINITION FOR REGISTRY (_tables/tools)
// ============================================================================

/**
 * This is how the tool would be registered in _tables/tools/yc-application-scoring.ts
 * 
 * The ToolDefinition interface requires:
 * - id: string (matches the filename)
 * - name: string (display name)
 * - description: string (human-readable description)
 * - run: Tool<unknown, unknown> (the tool() instance from AI SDK)
 * 
 * This allows the tool to be loaded by getToolById() and assigned to agents.
 */
export const ycApplicationScoringToolDefinition: ToolDefinition = {
  id: "yc-application-scoring",
  name: "YC Application Scoring Workflow",
  description:
    "Scores YC startup applications based on team experience, market size, and traction. " +
    "Filters applications by keywords, calculates scores, selects top candidates, and assigns them to reviewers.",
  runtime: "internal" as const,
  // Type assertion needed because ToolDefinition expects Tool<unknown, unknown>
  // but our tool has specific input/output types. This is safe because the
  // AI SDK will validate inputs at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: ycApplicationScoringTool as any,
};

// ============================================================================
// TYPE EXPORTS (for TypeScript consumers)
// ============================================================================

/**
 * TypeScript types inferred from the Zod schemas.
 * These provide type safety when calling the tool programmatically.
 */
export type YCApplicationScoringInput = z.infer<
  typeof ycApplicationScoringTool.inputSchema
>;

export type YCApplicationScoringOutput = Record<string, unknown>;

// ============================================================================
// INTEGRATION NOTES
// ============================================================================

/**
 * HOW THIS TOOL GETS USED BY AGENTS:
 * 
 * 1. Registration in _tables/tools/yc-application-scoring.ts:
 *    ```ts
 *    import { ycApplicationScoringToolDefinition } from './generated/yc-application-scoring';
 *    export default ycApplicationScoringToolDefinition;
 *    ```
 * 
 * 2. Assignment to agent in _tables/agents/alex-kim.ts:
 *    ```ts
 *    toolIds: ["requirements_digest", "launch_tracker", "yc-application-scoring"]
 *    ```
 * 
 * 3. Agent execution (app/api/workforce/agent/route.ts):
 *    - Agent loads tool via getToolById("yc-application-scoring")
 *    - Tool is added to toolMap: { "yc-application-scoring": toolDef.run }
 *    - Agent SDK receives tools object and can call the tool when needed
 *    - Model sees the description and inputSchema, decides to call it
 *    - AI SDK validates input, calls execute(), returns result to model
 * 
 * 4. Model interaction:
 *    User: "Score the new YC applications with keywords AI and SaaS"
 *    Model: Calls ycApplicationScoringTool with { keywords: ["AI", "SaaS"] }
 *    Tool: Executes workflow chain, returns assignments
 *    Model: "I've scored the applications. Top 3 candidates assigned to reviewers."
 * 
 * KEY DIFFERENCES FROM CURRENT APPROACH:
 * - Tools are registered in _tables/tools/*.ts files (not inline in agent config)
 * - Tools use tool() from "ai" package (not custom ToolDefinition wrapper)
 * - The description field is CRITICAL - model uses it to decide when to call the tool
 * - inputSchema fields should have .describe() for better model understanding
 * - execute() receives already-validated input (AI SDK handles validation)
 * - Return value must be JSON-serializable (no functions, classes, etc.)
 */

// ============================================================================
// INDIVIDUAL NODE FUNCTIONS (for partial execution)
// ============================================================================

/**
 * These individual node functions could be exported for:
 * - Testing individual nodes
 * - Partial workflow execution
 * - Reuse in other workflows
 */

export async function getNewApplicationsNode(): Promise<{
  applications: Array<Record<string, unknown>>;
}> {
  // Implementation from node "Get New Applications"
  // Mock implementation for example
  return {
    applications: [
      { id: "app_001", company_name: "Example Corp", description: "AI startup" },
    ],
  };
}

export async function filterByKeywordsNode(input: {
  applications: Array<Record<string, unknown>>;
  keywords: string[];
}): Promise<{
  filtered_applications: Array<Record<string, unknown>>;
}> {
  // Implementation from node "Filter by Keywords"
  const { applications, keywords } = input;
  const filtered = applications.filter((app) => {
    const desc = String(app.description || "").toLowerCase();
    return keywords.some((kw) => desc.includes(kw.toLowerCase()));
  });
  return { filtered_applications: filtered };
}

export { scoreApplicationsNode };

export async function selectTopApplicationsNode(input: {
  scored_applications: Array<Record<string, unknown>>;
  minScoreThreshold: number;
}): Promise<{
  top_applications: Array<Record<string, unknown>>;
}> {
  // Implementation from node "Select Top Applications"
  const { scored_applications, minScoreThreshold } = input;
  const top = scored_applications.filter(
    (app) => Number(app.score || 0) >= minScoreThreshold
  );
  return { top_applications: top };
}

export async function assignForReviewNode(input: {
  top_applications: Array<Record<string, unknown>>;
  reviewers: string[];
}): Promise<{
  assignments: Record<string, string>;
}> {
  // Implementation from node "Assign for Review"
  const { top_applications, reviewers } = input;
  const assignments: Record<string, string> = {};
  let reviewerIndex = 0;
  
  for (const app of top_applications) {
    const appId = String(app.id || "");
    if (appId) {
      assignments[appId] = reviewers[reviewerIndex % reviewers.length];
      reviewerIndex++;
    }
  }
  
  return { assignments };
}

