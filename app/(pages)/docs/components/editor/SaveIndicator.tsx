"use client";

import { useDocsStore } from "../../store";
import { Check, AlertCircle, Loader2, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SaveIndicator() {
  const saveStatus = useDocsStore((state) => state.saveStatus);
  const lastSavedAt = useDocsStore((state) => state.lastSavedAt);
  const isDirty = useDocsStore((state) => state.isDirty);
  const save = useDocsStore((state) => state.save);

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );

      case "saved":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">
              Saved {lastSavedAt ? formatTime(lastSavedAt) : ""}
            </span>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Save failed</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={save}
              className="h-6 px-2 text-xs"
            >
              Retry
            </Button>
          </div>
        );

      case "idle":
      default:
        return (
          <div className={cn(
            "flex items-center gap-2",
            isDirty ? "text-amber-600" : "text-muted-foreground"
          )}>
            <Cloud className="h-4 w-4" />
            <span className="text-sm">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center">
      {getStatusDisplay()}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "just now";
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
