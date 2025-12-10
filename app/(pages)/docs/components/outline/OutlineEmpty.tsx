"use client";

import { FileText } from "lucide-react";

export function OutlineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <FileText className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">
        No headings yet. Add headings to your document to see them here.
      </p>
    </div>
  );
}
