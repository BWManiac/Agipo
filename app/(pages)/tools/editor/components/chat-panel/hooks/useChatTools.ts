import { useEffect, useRef } from "react";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useWorkflowGeneratorStore } from "../../../store";
import { applyToolResult } from "../../../tools/applyToolResult";
import type { ToolResult } from "../../../tools/toolIntents";

type ChatHelpers = Pick<UseChatHelpers<UIMessage>, "messages" | "addToolResult">;

/**
 * @file app/experiments/workflow-generator/components/chat-panel/hooks/useChatTools.ts
 * @description A hook to manage the complex logic of handling AI tool calls. It
 * is the "brain" of the chat panel's interaction with the workflow.
 *
 * Responsibilities:
 * - It listens for incoming messages from the `useChat` hook via a `useEffect`.
 * - It processes tool calls requested by the AI, distinguishing between client-side
 *   and server-side tools.
 * - It executes client-side tools (e.g., `inspect_node`) directly, since the
 *   browser has the most up-to-date state.
 * - It applies the results of server-side mutation tools (which are returned
 *   as "intent" payloads) to the Zustand store via `applyToolResult`.
 * - It uses `useRef` to prevent re-processing of tool calls during re-renders.
 */
export function useChatTools({ messages, addToolResult }: ChatHelpers) {
  const processedToolCallIds = useRef<Set<string>>(new Set());
  const handledInspectToolCalls = useRef<Set<string>>(new Set());

  useEffect(() => {
    // When tool responses arrive, convert their structured intent payloads into
    // direct Zustand mutations so the canvas reflects agent decisions instantly.
    for (const message of messages) {
      for (const part of message.parts) {
        if (!isToolUIPart(part)) continue;

        // Handle the client-side execution of the `inspect_node` tool.
        if (
          String(getToolName(part)) === "inspect_node" &&
          part.state === "input-available" &&
          !handledInspectToolCalls.current.has(part.toolCallId)
        ) {
          handledInspectToolCalls.current.add(part.toolCallId);

          const nodeId =
            typeof (part.input as Record<string, unknown> | undefined)?.nodeId ===
            "string"
              ? ((part.input as Record<string, unknown>).nodeId as string)
              : undefined;
          const includeConnections =
            typeof (part.input as Record<string, unknown> | undefined)
              ?.includeConnections === "boolean"
              ? Boolean(
                  (part.input as Record<string, unknown>).includeConnections
                )
              : false;

          const state = useWorkflowGeneratorStore.getState();
          const node = nodeId
            ? state.nodes.find((candidate) => candidate.id === nodeId)
            : undefined;

          if (!nodeId || !node) {
            void addToolResult({
              state: "output-error",
              tool: "inspect_node",
              toolCallId: part.toolCallId,
              errorText: nodeId
                ? `Node ${nodeId} was not found.`
                : "Node ID missing in inspect request.",
            });
            continue;
          }

          const incomingEdges = includeConnections
            ? state.edges.filter((edge) => edge.target === nodeId)
            : [];
          const outgoingEdges = includeConnections
            ? state.edges.filter((edge) => edge.source === nodeId)
            : [];

          void addToolResult({
            state: "output-available",
            tool: "inspect_node",
            toolCallId: part.toolCallId,
            output: {
              node: {
                id: node.id,
                title: node.data.title,
                code: node.data.code,
                flowSummary: node.data.flow.summary,
                spec: node.data.spec,
                position: node.position,
              },
              incomingEdges,
              outgoingEdges,
            },
          });
        }

        // Apply the result of server-side mutation tools.
        if (part.state !== "output-available") continue;
        if (processedToolCallIds.current.has(part.toolCallId)) continue;

        processedToolCallIds.current.add(part.toolCallId);
        const result = part.output as ToolResult | undefined;
        if (result?.intent) {
          applyToolResult(result);
        }
      }
    }
  }, [messages, addToolResult]);
}
