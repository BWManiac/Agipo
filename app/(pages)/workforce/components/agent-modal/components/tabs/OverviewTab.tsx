import type { AgentConfig } from "@/_tables/types";
import { type TabId } from "../../AgentModal";
import { StatusCard } from "../shared/StatusCard";
import { AttentionList } from "../shared/AttentionList";
import { QuickActions } from "../shared/QuickActions";
import { ActivityHighlights } from "../shared/ActivityHighlights";

interface OverviewTabProps {
  agent: AgentConfig;
  onTabChange: (id: TabId) => void;
}

export function OverviewTab({ agent, onTabChange }: OverviewTabProps) {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full grid grid-cols-12 gap-8">
      {/* Left Column (Status & Attention) - Span 7 */}
      <div className="col-span-7 space-y-6">
        <StatusCard />
        <AttentionList />
      </div>

      {/* Right Column (Activity & Actions) - Span 5 */}
      <div className="col-span-5 space-y-6">
        <QuickActions onTabChange={onTabChange} />
        <ActivityHighlights />
      </div>
    </div>
  );
}

