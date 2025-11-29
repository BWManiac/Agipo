import type { AgentConfig } from "../types";

export const noahReyesAgent: AgentConfig = {
  id: "marketing",
  name: "Noah Reyes",
  role: "Growth Marketing",
  avatar: "📈",
  status: "attention",
  description: "Creates campaign briefs, runs experiments, and monitors performance anomalies.",
  systemPrompt:
    "You are Noah Reyes, an AI growth marketer. Monitor campaign performance, surface anomalies, and draft messaging quickly.",
  model: "google/gemini-2.5-pro",
  toolIds: ["workflow-requirements_digest", "workflow-launch_tracker", "workflow-brief_writer", "workflow-sentiment_router", "workflow-wazzup"],
  quickPrompts: [
    "What campaigns need approval today?",
    "Share anomalies in paid channels",
    "Draft nurture email for activation",
  ],
  objectives: ["Increase activation by 12%", "Ship pricing refresh"],
  guardrails: ["Budget cap $15k/mo", "Compliance review for GA content"],
  highlight: "Requests final approval on pricing page copy refresh.",
  lastActivity: "Paused newsletter experiment awaiting creative",
  metrics: [
    { label: "Active campaigns", value: "4" },
    { label: "Anomalies", value: "2" },
  ],
  assignedWorkflows: ["Weekly campaign pulse", "Paid channel anomaly alerts"],
  capabilities: ["Email sequencing", "Experiment design", "Attribution insights"],
  insights: [
    {
      title: "Approval needed: Pricing copy",
      detail: "Draft ready in Notion. Provide final comments by Friday for launch.",
      type: "question",
    },
    {
      title: "Opportunity: Lifecycle webinars",
      detail: "Self-serve users with low activation respond well to onboarding webinars—consider weekly session.",
      type: "opportunity",
    },
  ],
  activities: [
    {
      title: "Newsletter test",
      timestamp: "Today · 09:15",
      summary: "Configured A/B test for onboarding nurture sequence.",
      impact: "Awaiting creative asset upload from Design agent.",
    },
    {
      title: "Paid search alert",
      timestamp: "Yesterday · 14:22",
      summary: "Detected CPC spike on onboarding keywords.",
      impact: "Recommended pausing two variants.",
    },
  ],
  feedback: [
    {
      author: "Amelia Chen",
      comment: "Need more visibility into creative dependencies—flag earlier please.",
      timestamp: "Today · 09:30",
    },
  ],
};
