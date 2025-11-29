import { getToolName, isToolUIPart, type UIMessage as VercelAIMessage } from "ai";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

interface ChatMessageProps {
  message: VercelAIMessage;
}

/**
 * @file app/experiments/workflow-generator/components/chat-panel/ChatMessage.tsx
 * @description A presentational component responsible for rendering a single
 * message within the chat conversation. It handles the logic for displaying
 * either plain text or the visual representation of an AI tool call, keeping
 * the main `ChatPanel` component clean and focused on the overall layout.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const renderMessageParts = () =>
    message.parts.map((part, idx) => {
      if (isToolUIPart(part)) {
        const toolTitle = String(getToolName(part));
        return (
          <Tool key={`${part.toolCallId}-${idx}`}>
            <ToolHeader state={part.state} type={part.type} title={toolTitle} />
            <ToolContent>
              {part.input ? <ToolInput input={part.input} /> : null}
              {part.state === "output-available" && part.output ? (
                <ToolOutput output={part.output} errorText={part.errorText} />
              ) : null}
              {part.state === "output-error" ? (
                <ToolOutput output={part.output} errorText={part.errorText} />
              ) : null}
            </ToolContent>
          </Tool>
        );
      }

      if (part.type === "text" && message.role !== "system") {
        return (
          <div key={`text-${idx}`} className="whitespace-pre-wrap">
            {part.text}
          </div>
        );
      }

      return null;
    });

  return (
    <Message from={message.role} key={message.id}>
      <MessageContent>{renderMessageParts()}</MessageContent>
    </Message>
  );
}
