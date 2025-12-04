import type { AgentConfig } from "../types";

export const miraPatelAgent: AgentConfig = {
  id: "pm",
  name: "Mira Patel",
  role: "Product Manager",
  avatar: "🧭",
  status: "active",
  description:
    "Synthesises feedback, prioritises roadmap items, and keeps delivery aligned with business goals.",
  systemPrompt:
    "You are Mira Patel, an AI Product Manager embedded with the Agipo team. Monitor initiatives, surface risks, and keep stakeholders aligned.",
  model: "google/gemini-2.5-pro",
  toolIds: ["workflow-requirements_digest", "workflow-launch_tracker", "workflow-stakeholder_pulse", "workflow-hohoho"],
  connectionToolBindings: [],
  quickPrompts: [
    "How confident are we in the onboarding launch?",
    "Summarise risks for the exec sync",
    "Draft stakeholder update for analytics parity",
  ],
  objectives: ["Accelerate PLG roadmap", "Improve onboarding completion"],
  guardrails: ["Escalate spend > $10k", "Respect enterprise release schedule"],
  highlight: "Identified 3 risks blocking the self-service onboarding initiative.",
  lastActivity: "Drafted Q2 roadmap update 12m ago",
  metrics: [
    { label: "Active initiatives", value: "5" },
    { label: "RAG health", value: "Green" },
  ],
  assignedWorkflows: ["Weekly Voice of Customer digest", "Launch-critical risk tracker"],
  capabilities: ["Roadmap synthesis", "Launch comms", "Stakeholder pulse"],
  insights: [
    {
      title: "Need approval: Delay onboarding rollout?",
      detail: "Enabling SMS verification would extend schedule by 1 sprint. Approve or decline adjustment?",
      type: "question",
    },
    {
      title: "Opportunity: PLG activation playbook",
      detail: "Pattern emerging from self-serve interviews suggests quick win with new activation checklist.",
      type: "opportunity",
    },
    {
      title: "Risk: Research bandwidth",
      detail: "User research agent is over capacity; backlog of 6 sessions still un-analysed.",
      type: "risk",
    },
  ],
  activities: [
    {
      title: "Story map refresh",
      timestamp: "Today · 10:24",
      summary: "Organised 14 discovery notes into 3 opportunity themes.",
      impact: "Proposed swapping sprint 18 stories with higher-signal items.",
    },
    {
      title: "Launch readiness review",
      timestamp: "Yesterday · 17:05",
      summary: "Flagged missing billing integration checklist for beta launch.",
      impact: "Sent tasks to Ops + PMM for follow-up.",
    },
    {
      title: "Stakeholder digest",
      timestamp: "Mon · 08:40",
      summary: "Summarised exec feedback from QBR recordings.",
      impact: "Recommended confidence downgrade on onboarding initiative.",
    },
  ],
  feedback: [
    {
      author: "Priya Desai",
      comment: "Great synthesis on onboarding risks—include projected revenue impact next time.",
      timestamp: "Yesterday · 18:12",
    },
    {
      author: "Leo Campos",
      comment: "Roadmap draft looked solid. Let's weave in analytics gating requirements earlier.",
      timestamp: "Mon · 11:48",
    },
  ],
};
