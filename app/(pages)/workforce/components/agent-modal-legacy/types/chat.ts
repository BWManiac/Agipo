import type { AgentConfig } from "@/_tables/types";

export type AgentChatSectionProps = {
  agent: AgentConfig;
  queuedPrompt: string | null;
  onQueuePrompt: (prompt: string | null) => void;
};

