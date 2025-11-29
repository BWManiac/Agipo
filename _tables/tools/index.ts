import { requirementsDigestTool } from "./requirements-digest";
import { launchTrackerTool } from "./launch-tracker";
import { stakeholderPulseTool } from "./stakeholder-pulse";
import { funnelWatchTool } from "./funnel-watch";
import { briefWriterTool } from "./brief-writer";
import { sentimentRouterTool } from "./sentiment-router";
import { summarizeRisksTool } from "./prototype-risk-summary";
import { quickSummaryTool } from "./quick-summary";
import { priorityCheckerTool } from "./priority-checker";
import { statusReporterTool } from "./status-reporter";

export const tools = [
  requirementsDigestTool,
  launchTrackerTool,
  stakeholderPulseTool,
  funnelWatchTool,
  briefWriterTool,
  sentimentRouterTool,
  summarizeRisksTool,
  quickSummaryTool,
  priorityCheckerTool,
  statusReporterTool,
];

export function getToolById(id: string) {
  return tools.find((tool) => tool.id === id);
}

export { summarizeRisksTool };
