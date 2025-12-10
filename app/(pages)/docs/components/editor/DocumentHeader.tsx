"use client";

import { useDocsStore } from "../../store";
import { FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function DocumentHeader() {
  const document = useDocsStore((state) => state.document);

  if (!document) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">{document.frontmatter.title}</h1>
        <p className="text-sm text-muted-foreground">
          Last edited {formatDistanceToNow(new Date(document.frontmatter.updated), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
