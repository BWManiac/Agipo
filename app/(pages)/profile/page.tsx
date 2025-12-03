import Link from "next/link";
import { Suspense } from "react";
import { ConnectionsSection } from "./components/integrations/ConnectionsSection";

const snapshotChips = [
  "Industry: B2B SaaS",
  "Teams: RevOps, Support",
  "Primary KPI: Net Retention",
];

const objectives = [
  "Increase pipeline quality",
  "Reduce ticket backlog",
  "Weekly business reviews",
];

const guardrails = [
  "PII masking: Enabled",
  "Compliance region: US-only",
  "Escalate spend > $5k",
];

const dictionaryFields = [
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

const eventStreams = [
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

const recommendations = [
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

const permissions = [
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

const activity = [
  {
    timestamp: "Today · 09:24",
    title: "Token refreshed for NetSuite",
    detail: "Priya Desai · Received email confirmation",
  },
  {
    timestamp: "Yesterday · 16:12",
    title: "Accepted workflow recommendation “Customer Health Review”",
    detail: "Workflow saved to drafts and scheduled weekly",
  },
  {
    timestamp: "Mon · 11:08",
    title: "Granted Forecast Co-Pilot access to Revenue data",
    detail: "Auto-notified agent creator · Scope: read-only",
  },
];

const roadmap = [
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
    description: "We’ll notify you when dashboards sync is ready.",
  },
];

const toneToClass: Record<"success" | "warning", string> = {
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 dark:bg-slate-950">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:px-8 lg:px-12 xl:px-24">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                Profile · Org level
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Northwind Automation Profile
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Give your agents a trusted understanding of your business context. Last updated 2h
                  ago by Priya Desai.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshotChips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Completeness"
                value="78%"
                helper="Connect billing system to reach 90%"
              />
              <MetricCard
                label="Healthy Connections"
                value="11 / 13"
                badge={{ label: "2 require attention", tone: "warning" }}
              />
              <MetricCard label="Context-enabled workflows" value="8" helper="+3 recommended" />
            </div>
          </header>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryLink href="#add-connection">Add connection</PrimaryLink>
            <GhostLink href="#edit-profile">Edit profile</GhostLink>
            <GhostLink href="#share-profile">Share with teammates</GhostLink>
          </div>
        </section>

        <CardSection
          title="Identity & Goals"
          description="Set the intent for how agents should prioritize work."
          action={{ label: "Update goals", href: "#update-goals" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock
              title="Operating Objectives"
              chips={objectives}
              helper="Agents use objectives to score recommendation relevance and urgency."
            />
            <InfoBlock
              title="Guardrails"
              chips={guardrails}
              helper="Applies across all marketplace agents unless overridden."
            />
          </div>
        </CardSection>

        <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse h-64" />}>
          <ConnectionsSection />
        </Suspense>

        <CardSection
          title="Knowledge Assets & Schemas"
          description="Contracts, datasets, and APIs agents can query."
          action={{ label: "Import schema", href: "#import-schema" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ListBlock title="Data Dictionary" items={dictionaryFields} />
            <ListBlock title="Event Streams" items={eventStreams} />
          </div>
        </CardSection>

        <CardSection
          title="Recommendations"
          description="Drafted by the AI orchestration engine based on your context."
          action={{ label: "View history", href: "#recommendation-history" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((recommendation) => (
              <article
                key={recommendation.headline}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 font-semibold uppercase tracking-[0.15em] dark:border-slate-700">
                    {recommendation.badge}
                  </span>
                  <span>{recommendation.meta}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {recommendation.headline}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {recommendation.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendation.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex flex-wrap gap-3">
                  {recommendation.actions.map((action) =>
                    action.primary ? (
                      <PrimaryLink key={action.label} href={action.href}>
                        {action.label}
                      </PrimaryLink>
                    ) : (
                      <GhostLink key={action.label} href={action.href}>
                        {action.label}
                      </GhostLink>
                    )
                  )}
                </div>
              </article>
            ))}
          </div>
        </CardSection>

        <CardSection
          title="Agent Access Control"
          description="Manage which agents can leverage each context domain."
          action={{ label: "Bulk actions", href: "#bulk-actions" }}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[220px_repeat(3,120px)_80px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400 max-md:hidden">
              <span>Agent</span>
              <span>Revenue Data</span>
              <span>Support Data</span>
              <span>Docs &amp; OKRs</span>
              <span>Logs</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {permissions.map((permission) => (
                <div
                  key={permission.agent}
                  className="grid gap-4 bg-white px-4 py-4 text-sm dark:bg-slate-900 md:grid-cols-[220px_repeat(3,120px)_80px]"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {permission.agent}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {permission.meta}
                    </div>
                  </div>
                  {permission.access.map((access, index) => (
                    <div
                      key={`${permission.agent}-${index}`}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      <span className="inline-flex h-4 w-8 items-center rounded-full bg-slate-200 p-0.5 dark:bg-slate-700">
                        <span className="h-3.5 w-3.5 rounded-full bg-slate-900 dark:bg-slate-200" />
                      </span>
                      {access}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardSection>

        <CardSection
          title="Activity & Audit"
          description="Everything agents and admins changed in this profile."
          action={{ label: "Export log", href: "#export-log" }}
        >
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.title}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[120px_1fr]"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {item.timestamp}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection
          title="Connector Roadmap"
          description="Prioritized by profile demand."
          action={{ label: "Submit request", href: "#submit-request" }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => (
              <div
                key={item.name}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  {item.badge}
                </span>
                <div>
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {item.name}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardSection>
      </main>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  badge?: { label: string; tone: "success" | "warning" };
};

function MetricCard({ label, value, helper, badge }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {helper ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      ) : null}
      {badge ? (
        <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneToClass[badge.tone]}`}>
          {badge.label}
        </span>
      ) : null}
    </div>
  );
}

type CardSectionProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
};

function CardSection({ title, description, action, children }: CardSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
          ) : null}
        </div>
        {action ? <GhostLink href={action.href}>{action.label}</GhostLink> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type InfoBlockProps = {
  title: string;
  chips: string[];
  helper?: string;
};

function InfoBlock({ title, chips, helper }: InfoBlockProps) {
  return (
    <div className="space-y-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/80">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300"
          >
            {chip}
          </span>
        ))}
      </div>
      {helper ? <p className="text-xs text-slate-500 dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

type ListBlockProps = {
  title: string;
  items: { name: string; description: string }[];
};

function ListBlock({ title, items }: ListBlockProps) {
  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-5 dark:bg-slate-900/80">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
};

function PrimaryLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
    >
      {children}
    </Link>
  );
}

function GhostLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}


