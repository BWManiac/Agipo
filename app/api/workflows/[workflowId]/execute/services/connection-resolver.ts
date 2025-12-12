/**
 * Connection Resolver Service
 *
 * Resolves required connections for workflow execution.
 * Matches workflow's requiredConnections against user's connected accounts.
 */

import { listConnections } from "@/app/api/connections/services/composio";
import { getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";
import type { ExecutionValidation } from "../types";

/**
 * Connection binding for workflow execution.
 * Maps toolkit slug to connection ID.
 */
export type ConnectionBindings = Record<string, string>;

/**
 * User's connected account from Composio.
 */
interface UserConnection {
  id: string;
  toolkitSlug: string;
  status: string;
}

/**
 * Resolves connections required for workflow execution.
 *
 * 1. Gets workflow metadata to find requiredConnections
 * 2. Gets user's connected accounts from Composio
 * 3. Matches required connections to user's accounts
 * 4. Returns bindings or validation errors
 *
 * @param workflowId - The workflow to execute
 * @param userId - The authenticated user
 * @returns Validation result with connection bindings or errors
 */
export async function resolveConnections(
  workflowId: string,
  userId: string
): Promise<{
  validation: ExecutionValidation;
  bindings: ConnectionBindings;
}> {
  // 1. Get workflow metadata (includes requiredConnections filtered by NO_AUTH)
  const metadata = await getWorkflowMetadata(workflowId);
  if (!metadata) {
    return {
      validation: {
        valid: false,
        errors: [`Workflow "${workflowId}" not found or not transpiled`],
        missingConnections: [],
      },
      bindings: {},
    };
  }

  const requiredConnections = metadata.requiredConnections || [];

  // If no connections required, we're good
  if (requiredConnections.length === 0) {
    return {
      validation: { valid: true, errors: [], missingConnections: [] },
      bindings: {},
    };
  }

  // 2. Get user's connected accounts
  const connectionsResponse = await listConnections(userId);
  const userConnections: UserConnection[] = connectionsResponse.items.map((item) => ({
    id: item.id,
    toolkitSlug: item.toolkit?.slug || "unknown",
    status: item.status || "unknown",
  }));

  // 3. Match required connections to user's accounts
  const bindings: ConnectionBindings = {};
  const missingConnections: string[] = [];

  for (const toolkitSlug of requiredConnections) {
    // Find an active connection for this toolkit
    const connection = userConnections.find(
      (c) => c.toolkitSlug === toolkitSlug && c.status === "ACTIVE"
    );

    if (connection) {
      bindings[toolkitSlug] = connection.id;
    } else {
      missingConnections.push(toolkitSlug);
    }
  }

  // 4. Return result
  if (missingConnections.length > 0) {
    const errorMsg = missingConnections.length === 1
      ? `Missing connection for "${missingConnections[0]}". Please connect this integration first.`
      : `Missing connections for: ${missingConnections.join(", ")}. Please connect these integrations first.`;

    return {
      validation: {
        valid: false,
        errors: [errorMsg],
        missingConnections,
      },
      bindings,
    };
  }

  return {
    validation: { valid: true, errors: [], missingConnections: [] },
    bindings,
  };
}

/**
 * Gets the list of required connections for a workflow.
 * Useful for UI to show connection status before execution.
 *
 * @param workflowId - The workflow ID
 * @returns List of required toolkit slugs (already filtered by NO_AUTH)
 */
export async function getRequiredConnections(
  workflowId: string
): Promise<string[]> {
  const metadata = await getWorkflowMetadata(workflowId);
  return metadata?.requiredConnections || [];
}
