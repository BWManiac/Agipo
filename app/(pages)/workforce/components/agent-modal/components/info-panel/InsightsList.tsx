import { Badge } from "@/components/ui/badge";
import type { InsightsListProps } from "../../types/info-panel/items";

export function InsightsList({ insights }: InsightsListProps) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Insights &amp; signals
      </h3>
      <div className="grid gap-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-xl border border-border bg-muted/40 p-4">
            <Badge variant="outline" className="mb-2 uppercase tracking-[0.16em]">
              {insight.type}
            </Badge>
            <h4 className="text-base font-semibold text-foreground">{insight.title}</h4>
            <p className="text-sm text-muted-foreground">{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

