"use client";

import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";

export function ErrorAlert() {
  const { error, clearError } = useWorkflowEditorStore();

  if (!error) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50",
        "animate-in slide-in-from-bottom-2 fade-in duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100"
          onClick={clearError}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


