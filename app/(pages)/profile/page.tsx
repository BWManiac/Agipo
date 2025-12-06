/**
 * Profile Page
 * 
 * Organization-level profile showing business context, connections, and recommendations.
 */

import { Suspense } from "react";
import { ConnectionsSection } from "./components/connections/ConnectionsSection";
import { MetricCard, PrimaryLink, GhostLink, SnapshotChips } from "./components/ProfileHeader";
import { CardSection, InfoBlock, ListBlock } from "./components/ProfileSections";
import {
  snapshotChips,
  objectives,
  guardrails,
  dictionaryFields,
  eventStreams,
  recommendations,
  permissions,
  activity,
  roadmap,
} from "./data/mock-data";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-100 py-12 dark:bg-slate-950">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:px-8 lg:px-12 xl:px-24">
        {/* Header Section */}
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
              <SnapshotChips chips={snapshotChips} />
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

        {/* Identity & Goals */}
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

        {/* Connections */}
        <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse h-64" />}>
          <ConnectionsSection />
        </Suspense>

        {/* Knowledge Assets */}
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

        {/* Recommendations */}
        <CardSection
          title="Recommendations"
          description="Drafted by the AI orchestration engine based on your context."
          action={{ label: "View history", href: "#recommendation-history" }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.headline} recommendation={rec} />
            ))}
          </div>
        </CardSection>

        {/* Agent Access Control */}
        <CardSection
          title="Agent Access Control"
          description="Manage which agents can leverage each context domain."
          action={{ label: "Bulk actions", href: "#bulk-actions" }}
        >
          <PermissionsTable permissions={permissions} />
        </CardSection>

        {/* Activity & Audit */}
        <CardSection
          title="Activity & Audit"
          description="Everything agents and admins changed in this profile."
          action={{ label: "Export log", href: "#export-log" }}
        >
          <ActivityList items={activity} />
        </CardSection>

        {/* Connector Roadmap */}
        <CardSection
          title="Connector Roadmap"
          description="Prioritized by profile demand."
          action={{ label: "Submit request", href: "#submit-request" }}
        >
          <RoadmapGrid items={roadmap} />
        </CardSection>
      </main>
    </div>
  );
}

// ============================================================================
// Inline Sub-Components (could be extracted further if needed)
// ============================================================================

type RecommendationCardProps = {
  recommendation: {
    badge: string;
    headline: string;
    description: string;
    meta: string;
    chips: string[];
    actions: Array<{ label: string; href: string; primary?: boolean }>;
  };
};

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
        <p className="text-sm text-slate-600 dark:text-slate-300">{recommendation.description}</p>
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
  );
}

type PermissionsTableProps = {
  permissions: Array<{
    agent: string;
    meta: string;
    access: string[];
  }>;
};

function PermissionsTable({ permissions }: PermissionsTableProps) {
  return (
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
              <div className="text-xs text-slate-500 dark:text-slate-400">{permission.meta}</div>
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
  );
}

type ActivityListProps = {
  items: Array<{
    timestamp: string;
    title: string;
    detail: string;
  }>;
};

function ActivityList({ items }: ActivityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[120px_1fr]"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {item.timestamp}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type RoadmapGridProps = {
  items: Array<{
    badge: string;
    name: string;
    description: string;
  }>;
};

function RoadmapGrid({ items }: RoadmapGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
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
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
