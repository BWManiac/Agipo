"use client";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <header className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      {subtitle ? (
        <p className="text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </header>
  );
}

