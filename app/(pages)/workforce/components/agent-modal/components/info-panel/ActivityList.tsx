import type { ActivityListProps } from "../../types/info-panel/items";

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Recent activity
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.title} className="rounded-xl border border-border bg-background p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {activity.timestamp}
            </div>
            <h4 className="mt-2 text-base font-semibold text-foreground">{activity.title}</h4>
            <p className="text-sm text-muted-foreground">{activity.summary}</p>
            <p className="mt-2 text-sm font-medium text-foreground">Impact: {activity.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

