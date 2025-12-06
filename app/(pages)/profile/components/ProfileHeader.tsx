/**
 * Profile Header Components
 * 
 * Metric cards and snapshot display for the profile page header.
 */

import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

export type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  badge?: { label: string; tone: "success" | "warning" };
};

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
};

// ============================================================================
// Styling
// ============================================================================

const toneToClass: Record<"success" | "warning", string> = {
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30",
};

// ============================================================================
// Components
// ============================================================================

export function MetricCard({ label, value, helper, badge }: MetricCardProps) {
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

export function PrimaryLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
    >
      {children}
    </Link>
  );
}

export function GhostLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

export function SnapshotChips({ chips }: { chips: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((item) => (
        <span
          key={item}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

