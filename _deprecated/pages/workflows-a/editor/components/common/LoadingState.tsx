"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = "Saving..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}


