import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AgentChat } from "../../AgentChat";
import type { AgentChatSectionProps } from "../types/chat";

export function AgentChatSection({ agent, queuedPrompt, onQueuePrompt }: AgentChatSectionProps) {
  return (
    <div className="flex flex-[1.6] flex-col border-border md:border-r">
      <div className="space-y-2 px-8 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quick prompts
        </h3>
        <div className="flex flex-wrap gap-2">
          {agent.quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onQueuePrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
      <AgentChat
        className="flex-1"
        agentId={agent.id}
        agentName={agent.name}
        defaultPrompt={agent.highlight}
        queuedPrompt={queuedPrompt}
        onPromptConsumed={() => onQueuePrompt(null)}
      />
    </div>
  );
}

