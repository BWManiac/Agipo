"use client";

import { useDocsStore } from "../../store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function ActivityTab({ docId }: { docId: string }) {
  const store = useDocsStore();
  const { activityLog, isLoading } = store;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activity...</div>;
  }

  if (activityLog.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        No activity yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {activityLog.map((activity) => (
          <div key={activity.id} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>{activity.actor.type === "agent" ? "🤖" : "👤"}</span>
                  <span className="font-medium text-sm">{activity.actor.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.type}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {activity.summary}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
