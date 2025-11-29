import type { AgentConfig, WorkflowSummary } from "@/_tables/types";

export type AgentInfoPanelProps = {
  agent: AgentConfig;
  tools: WorkflowSummary[];
  isLoadingTools: boolean;
  toolsError: string | null;
  feedback: string;
  onFeedbackChange: (value: string) => void;
  onFeedbackSubmit: () => void;
  onSelectTool: (toolId: string) => void;
  onEditTools: () => void;
};

