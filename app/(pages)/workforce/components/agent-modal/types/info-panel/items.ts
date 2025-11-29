import type { AgentConfig, WorkflowSummary } from "@/_tables/types";

export type SectionProps = {
  heading: string;
  items: string[];
};

export type InsightsListProps = {
  insights: AgentConfig["insights"];
};

export type ToolUsageListProps = {
  tools: WorkflowSummary[];
  isLoading: boolean;
  error: string | null;
  onSelect: (toolId: string) => void;
  onEdit: () => void;
};

export type ActivityListProps = {
  activities: AgentConfig["activities"];
};

export type FeedbackSectionProps = {
  feedback: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  history: AgentConfig["feedback"];
};

