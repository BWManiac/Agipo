/**
 * Profile Page Mock Data
 * 
 * Static data for the profile page display.
 */

export const snapshotChips = [
  "Industry: B2B SaaS",
  "Teams: RevOps, Support",
  "Primary KPI: Net Retention",
];

export const objectives = [
  "Increase pipeline quality",
  "Reduce ticket backlog",
  "Weekly business reviews",
];

export const guardrails = [
  "PII masking: Enabled",
  "Compliance region: US-only",
  "Escalate spend > $5k",
];

export const dictionaryFields = [
  {
    name: "deal_stage",
    description: "Enum · Source: HubSpot",
  },
  {
    name: "ticket_satisfaction_score",
    description: "Float · Source: Zendesk",
  },
  {
    name: "net_retention_percent",
    description: "Calculated · Blend: NetSuite + HubSpot",
  },
];

export const eventStreams = [
  {
    name: "Weekly pipeline snapshot",
    description: "Cron · Mondays 6am PT",
  },
  {
    name: "Customer churn alerts",
    description: "Webhook · Slack #revops-alerts",
  },
  {
    name: "Agent activity log",
    description: "Every run · Stored 30 days",
  },
];

export const recommendations = [
  {
    badge: "Workflow draft",
    headline: "Customer Health Review – Weekly",
    description:
      "Combine HubSpot pipeline data with Zendesk escalations to generate a CSM-ready briefing every Monday.",
    meta: "Confidence: 92%",
    chips: ["Uses HubSpot", "Uses Zendesk", "Outputs Notion doc"],
    actions: [
      { label: "Open draft", href: "#open-draft", primary: true },
      { label: "Adjust inputs", href: "#adjust-inputs" },
      { label: "Dismiss", href: "#dismiss" },
    ],
  },
  {
    badge: "Marketplace agent",
    headline: "Forecast Co-Pilot",
    description:
      "Agent from RevOps Labs that calibrates forecasts using NetSuite revenue actuals and pipeline velocity trends.",
    meta: "Match score: 88%",
    chips: ["Requires NetSuite", "Requires HubSpot", "Compliance-ready"],
    actions: [
      { label: "Preview agent", href: "#preview-agent" },
      { label: "Grant access", href: "#grant-access" },
    ],
  },
];

export const permissions = [
  {
    agent: "Pipeline Autopilot",
    meta: "Owned agent · Internal",
    access: ["Full", "Limited", "Off", "On"],
  },
  {
    agent: "Support Triage Assistant",
    meta: "Marketplace · RevOps Labs",
    access: ["Off", "Full", "Limited", "On"],
  },
  {
    agent: "Quarterly Business Review Generator",
    meta: "Marketplace · Compass AI",
    access: ["Limited", "Limited", "Full", "On"],
  },
];

export const activity = [
  {
    timestamp: "Today · 09:24",
    title: "Token refreshed for NetSuite",
    detail: "Priya Desai · Received email confirmation",
  },
  {
    timestamp: "Yesterday · 16:12",
    title: 'Accepted workflow recommendation "Customer Health Review"',
    detail: "Workflow saved to drafts and scheduled weekly",
  },
  {
    timestamp: "Mon · 11:08",
    title: "Granted Forecast Co-Pilot access to Revenue data",
    detail: "Auto-notified agent creator · Scope: read-only",
  },
];

export const roadmap = [
  {
    badge: "In Beta",
    name: "Salesforce Marketing Cloud",
    description: "Join waitlist · unlocks lifecycle nurture workflows.",
  },
  {
    badge: "Planned",
    name: "Gainsight",
    description: "Help us understand how you score health trends.",
  },
  {
    badge: "Requested by you",
    name: "Looker",
    description: "We'll notify you when dashboards sync is ready.",
  },
];

