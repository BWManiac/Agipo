"use client";

import { useBrowserStore, type ActionType } from "../../store";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: { value: ActionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "navigate", label: "Navigate" },
  { value: "click", label: "Click" },
  { value: "type", label: "Type" },
  { value: "extract", label: "Extract" },
  { value: "screenshot", label: "Screenshot" },
  { value: "wait", label: "Wait" },
];

interface ActionFiltersProps {
  typeCounts: Record<string, number>;
}

export function ActionFilters({ typeCounts }: ActionFiltersProps) {
  const actionFilter = useBrowserStore((state) => state.actionFilter);
  const setActionFilter = useBrowserStore((state) => state.setActionFilter);

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => {
        const count =
          option.value === "all" ? totalCount : typeCounts[option.value] || 0;
        const isActive = actionFilter === option.value;

        // Hide filters with 0 count (except All)
        if (count === 0 && option.value !== "all") return null;

        return (
          <button
            key={option.value}
            onClick={() => setActionFilter(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {option.label}
            {count > 0 && (
              <span className={cn("ml-1.5", isActive ? "opacity-80" : "opacity-60")}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
