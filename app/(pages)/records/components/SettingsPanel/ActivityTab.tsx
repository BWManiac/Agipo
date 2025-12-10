"use client";

import { useRecordsStore } from "../../store";
import { formatDistanceToNow } from "date-fns";
import { User, Zap } from "lucide-react";

export function ActivityTab() {
  const { activityLog, isLoadingActivity } = useRecordsStore();

  if (isLoadingActivity) {
    return <div className="text-sm text-muted-foreground py-4">Loading...</div>;
  }

  if (activityLog.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">No activity yet</p>
        <p className="text-xs mt-1">Changes to this table will appear here</p>
      </div>
    );
  }

  const getActionText = (type: string, rowCount: number) => {
    switch (type) {
      case "insert":
        return `added ${rowCount} row${rowCount > 1 ? "s" : ""}`;
      case "update":
        return `updated ${rowCount} row${rowCount > 1 ? "s" : ""}`;
      case "delete":
        return `deleted ${rowCount} row${rowCount > 1 ? "s" : ""}`;
      default:
        return `modified ${rowCount} row${rowCount > 1 ? "s" : ""}`;
    }
  };

  const getActorIcon = (type: string, avatar?: string) => {
    if (type === "agent") {
      return (
        <span className="w-6 h-6 rounded-md bg-secondary border flex items-center justify-center text-xs">
          {avatar || "🤖"}
        </span>
      );
    }
    if (type === "workflow") {
      return (
        <span className="w-6 h-6 rounded-md bg-purple-100 border border-purple-200 flex items-center justify-center">
          <Zap className="h-3 w-3 text-purple-600" />
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
        <User className="h-3 w-3" />
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Activity Timeline</h3>

      <div className="space-y-3">
        {activityLog.map((entry) => (
          <div key={entry.id} className="flex gap-3">
            {getActorIcon(entry.actor.type, entry.actor.avatar)}
            <div className="flex-1 text-xs">
              <span className="font-medium">{entry.actor.name}</span>
              <span className="text-muted-foreground">
                {" "}
                {getActionText(entry.type, entry.rowCount)}
              </span>
              {entry.columns && entry.columns.length > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  ({entry.columns.join(", ")})
                </span>
              )}
              <div className="text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
