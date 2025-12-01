import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentInfoPanelProps } from "../../types/info-panel/index";
import { Section } from "./Section";
import { InsightsList } from "./InsightsList";
import { ToolUsageList } from "./ToolUsageList";
import { ActivityList } from "./ActivityList";
import { WorkflowList } from "./WorkflowList";
import { FeedbackSection } from "./FeedbackSection";

export function AgentInfoPanel({
  agent,
  tools,
  isLoadingTools,
  toolsError,
  feedback,
  onFeedbackChange,
  onFeedbackSubmit,
  onSelectTool,
  onEditTools,
}: AgentInfoPanelProps) {
  return (
    <div className="flex w-full max-w-[560px] flex-col">
      <ScrollArea className="h-full px-8 pb-8">
        <Section heading="Objectives" items={agent.objectives} />
        <Section heading="Guardrails" items={agent.guardrails} />
        
        <InsightsList insights={agent.insights} />
        
        <ToolUsageList
          tools={tools}
          isLoading={isLoadingTools}
          error={toolsError}
          onSelect={onSelectTool}
          onEdit={onEditTools}
        />
        
        <ActivityList activities={agent.activities} />
        
        <WorkflowList workflows={agent.assignedWorkflows} />
        
        <FeedbackSection
          feedback={feedback}
          onChange={onFeedbackChange}
          onSubmit={onFeedbackSubmit}
          history={agent.feedback}
        />
      </ScrollArea>
    </div>
  );
}

