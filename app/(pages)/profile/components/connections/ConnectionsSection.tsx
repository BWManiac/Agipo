"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConnectionsDialog } from "./ConnectionsDialog";

const mockConnections = [
  {
    name: "HubSpot",
    meta: "CRM · OAuth",
    domains: ["Accounts", "Deals", "Pipeline Health"],
    status: { label: "Active", tone: "success" as const },
    sync: { label: "5 minutes ago", helper: "Webhook streaming" },
  },
  {
    name: "Zendesk",
    meta: "Support · OAuth",
    domains: ["Tickets", "SLAs", "Sentiment"],
    status: { label: "Active", tone: "success" as const },
    sync: { label: "12 minutes ago", helper: "Streaming" },
  },
  {
    name: "NetSuite",
    meta: "Finance · API key",
    domains: ["Revenue", "Invoices"],
    status: { label: "Token expiring", tone: "warning" as const },
    sync: { label: "3 hours ago", helper: "Refresh token" },
    cta: { href: "#refresh-token", label: "Refresh token" },
  },
  {
    name: "Manual upload: OKRs.q1.csv",
    meta: "Document · Uploaded by Priya",
    domains: ["Objectives", "Owners"],
    status: { label: "Indexed", tone: "success" as const },
    sync: { label: "Yesterday", helper: "Valid through Apr 30" },
  },
];

const toneToClass: Record<"success" | "warning", string> = {
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30",
};

/**
 * ConnectionsSection component
 * Client component wrapper for the Connections section with dialog state management
 */
export function ConnectionsSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchParams = useSearchParams();

  // Auto-open dialog if action=open-connections query param is present
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "open-connections") {
      setDialogOpen(true);
      // Clean up the URL without triggering a navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Connections
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              All authorized systems that feed context into Agipo.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            View connection library
          </button>
        </header>
        <div className="mt-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400 md:grid-cols-[220px_1fr_140px_160px]">
              <span>Integration</span>
              <span>Context Domains</span>
              <span>Status</span>
              <span>Last Sync</span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {mockConnections.map((connection) => (
                <div
                  key={connection.name}
                  className="grid gap-4 bg-white px-4 py-4 text-sm dark:bg-slate-900 md:grid-cols-[220px_1fr_140px_160px]"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {connection.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {connection.meta}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {connection.domains.map((domain) => (
                      <span
                        key={domain}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneToClass[connection.status.tone]}`}
                    >
                      {connection.status.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div>{connection.sync.label}</div>
                    {connection.cta ? (
                      <Link
                        href={connection.cta.href}
                        className="text-xs font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-slate-100"
                      >
                        {connection.cta.label}
                      </Link>
                    ) : (
                      <div className="text-slate-400">{connection.sync.helper}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ConnectionsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

