/**
 * Profile Section Components
 * 
 * Reusable section layouts and block components for the profile page.
 */

import { GhostLink } from "./ProfileHeader";

// ============================================================================
// Types
// ============================================================================

export type CardSectionProps = {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
};

export type InfoBlockProps = {
  title: string;
  chips: string[];
  helper?: string;
};

export type ListBlockProps = {
  title: string;
  items: { name: string; description: string }[];
};

// ============================================================================
// Components
// ============================================================================

export function CardSection({ title, description, action, children }: CardSectionProps) {
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

export function InfoBlock({ title, chips, helper }: InfoBlockProps) {
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

export function ListBlock({ title, items }: ListBlockProps) {
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

