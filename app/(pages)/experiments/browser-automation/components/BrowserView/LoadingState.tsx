"use client";

import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Starting browser session...</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This usually takes a few seconds. The browser will appear once the
          session is ready.
        </p>
      </div>
    </div>
  );
}
