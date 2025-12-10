"use client";

import { FileText } from "lucide-react";
import { CreateDocumentButton } from "./CreateDocumentButton";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-muted rounded-full mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No documents yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Create your first document to start writing with AI assistance.
      </p>
      <CreateDocumentButton />
    </div>
  );
}
