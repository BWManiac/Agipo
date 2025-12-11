"use client";

import { useDocsStore } from "../../store";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SaveStatus() {
  const store = useDocsStore();
  const { saveStatus, lastSaved, isDirty } = store;

  if (saveStatus === "saving") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (saveStatus === "error") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="w-4 h-4" />
        <span>Save failed</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="w-4 h-4" />
        <span>Saved {formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Check className="w-4 h-4" />
      <span>Saved</span>
    </div>
  );
}
