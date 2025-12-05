"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KnowledgeSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  iconBgColor: string;
  children: ReactNode;
}

export function KnowledgeSection({
  title,
  description,
  icon,
  iconBgColor,
  children,
}: KnowledgeSectionProps) {
  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            iconBgColor
          )}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

interface KeyValueRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function KeyValueRow({ label, value, isLast }: KeyValueRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        !isLast && "border-b border-border/50"
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded">
        {value}
      </span>
    </div>
  );
}

interface ProjectRowProps {
  name: string;
  notes?: string;
  status?: "active" | "blocked" | "completed";
}

export function ProjectRow({ name, notes, status }: ProjectRowProps) {
  const statusColors = {
    active: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    blocked: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="p-4 flex items-center justify-between border-b border-border/50 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{name}</p>
        {notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{notes}</p>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "text-xs font-medium px-2 py-1 rounded capitalize",
            statusColors[status]
          )}
        >
          {status}
        </span>
      )}
    </div>
  );
}

interface ContextItemProps {
  text: string;
}

export function ContextItem({ text }: ContextItemProps) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="text-primary mt-1">•</span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

interface DecisionRowProps {
  decision: string;
  date?: string;
}

export function DecisionRow({ decision, date }: DecisionRowProps) {
  return (
    <div className="p-4 flex items-center justify-between border-b border-border/50 last:border-b-0">
      <p className="text-sm">{decision}</p>
      {date && (
        <span className="text-xs text-muted-foreground shrink-0 ml-4">
          {date}
        </span>
      )}
    </div>
  );
}

