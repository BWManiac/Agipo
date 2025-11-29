import { useMemo } from "react";
import { DefaultChatTransport } from "ai";
import { useWorkflowGeneratorStore } from "../../../store";
import { serializeWorkflowContext } from "../../../services/workflowContextService";

/**
 * @file app/(pages)/workflow-generator/components/chat-panel/hooks/useChatTransport.ts
 * @description A custom hook that creates a specialized API transport for the AI chat.
 * This transport intercepts every outgoing request to inject the latest
 * workflow context, ensuring the AI assistant always knows what's on the canvas.
 * By isolating this logic, the main ChatPanel component remains clean and
 * unaware of the details of API communication.
 */
export function useChatTransport() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        prepareSendMessagesRequest: async ({
          id,
          messages,
          body,
          trigger,
          messageId,
        }) => {
          const workflowContext = serializeWorkflowContext(
            useWorkflowGeneratorStore.getState()
          );

          return {
            body: {
              ...(body ?? {}),
              id,
              messages,
              trigger,
              messageId,
              workflowContext,
            },
          };
        },
      }),
    []
  );

  return transport;
}
