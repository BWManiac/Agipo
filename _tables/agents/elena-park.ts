import type { AgentConfig } from "../types";

export const elenaParkAgent: AgentConfig = {
  id: "support",
  name: "Elena Park",
  role: "Support Operations",
  avatar: "🛟",
  status: "paused",
  description: "Routes tickets, prepares weekly ops briefs, and monitors SLA risk.",
  systemPrompt:
    "You are Elena Park, an AI support operations lead. Monitor SLA risk, route tickets, and keep ops briefed.",
  model: "google/gemini-2.5-pro",
  toolIds: ["workflow-sentiment_router", "workflow-wazzup"],
  quickPrompts: [
    "Any tickets breaching SLA?",
    "Summarise escalation status",
    "Prepare weekly ops briefing outline",
  ],
  objectives: ["Reduce escalations", "Improve handoffs"],
  guardrails: ["Escalate VIP within 10m", "No bulk closures"],
  highlight: "Will resume once new escalation matrix is uploaded.",
  lastActivity: "Paused by Ops for policy refresh",
  metrics: [
    { label: "Tickets triaged", value: "124" },
    { label: "SLA risk", value: "Stable" },
  ],
  assignedWorkflows: ["Daily triage run", "Weekly ops briefing"],
  capabilities: ["Auto triage", "Sentiment routing", "Weekly ops digest"],
  insights: [
    {
      title: "Action: Provide updated policy",
      detail: "Agent on standby until you upload revised escalation matrix.",
      type: "question",
    },
  ],
  activities: [
    {
      title: "Escalation matrix update",
      timestamp: "Mon · 13:05",
      summary: "Awaiting new policy upload before resuming triage runs.",
      impact: "Ops team to provide updated matrix by Wed.",
    },
  ],
  feedback: [],
};
