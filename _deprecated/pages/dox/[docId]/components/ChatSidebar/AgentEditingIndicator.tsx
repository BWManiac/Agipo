"use client";

import { useDocsStore } from "../../store";
import { Loader2 } from "lucide-react";

export function AgentEditingIndicator() {
  const store = useDocsStore();
  const { isStreaming } = store;

  if (!isStreaming) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      <span className="text-sm font-medium">Agent is editing...</span>
    </div>
  );
}
