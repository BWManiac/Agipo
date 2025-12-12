/**
 * Step Name Resolver Service
 *
 * Loads workflow.json and builds a stepId → human-readable name mapping.
 * Used to display friendly step names in the execution progress UI.
 */

import fs from "fs/promises";
import path from "path";

const WORKFLOWS_DIR = path.join(process.cwd(), "_tables", "workflows");

/**
 * Step info extracted from workflow.json
 */
export interface StepInfo {
  id: string;
  name: string;
  toolId?: string;
  toolkitName?: string;
}

/**
 * Loads step information from workflow.json.
 * Returns a Map of stepId → StepInfo for quick lookup.
 *
 * @param workflowId - The workflow ID
 * @returns Map of stepId to StepInfo, or empty map if workflow not found
 */
export async function loadStepNames(
  workflowId: string
): Promise<Map<string, StepInfo>> {
  const stepMap = new Map<string, StepInfo>();

  try {
    const workflowJsonPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.json");
    const content = await fs.readFile(workflowJsonPath, "utf-8");
    const workflow = JSON.parse(content);

    if (workflow.steps && Array.isArray(workflow.steps)) {
      for (const step of workflow.steps) {
        if (step.id) {
          stepMap.set(step.id, {
            id: step.id,
            name: step.name || step.toolId || step.id,
            toolId: step.toolId,
            toolkitName: step.toolkitName,
          });
        }
      }
    }

    console.log(`[step-name-resolver] Loaded ${stepMap.size} step names for ${workflowId}`);
  } catch (error) {
    console.warn(`[step-name-resolver] Could not load step names for ${workflowId}:`, error);
  }

  return stepMap;
}

/**
 * Gets a human-readable step name from the map, with fallback.
 *
 * @param stepMap - The step name map from loadStepNames()
 * @param stepId - The step ID to look up
 * @returns Human-readable name, or the stepId if not found
 */
export function getStepName(
  stepMap: Map<string, StepInfo>,
  stepId: string
): string {
  const info = stepMap.get(stepId);
  return info?.name || stepId;
}

/**
 * Gets full step info from the map.
 *
 * @param stepMap - The step name map from loadStepNames()
 * @param stepId - The step ID to look up
 * @returns StepInfo or undefined if not found
 */
export function getStepInfo(
  stepMap: Map<string, StepInfo>,
  stepId: string
): StepInfo | undefined {
  return stepMap.get(stepId);
}
