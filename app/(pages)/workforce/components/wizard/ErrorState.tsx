"use client";

import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onGoBack: () => void;
}

export function ErrorState({ error, onRetry, onGoBack }: ErrorStateProps) {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircleIcon className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold">Error creating agent</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onGoBack}>
          Go back to form
        </Button>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}
