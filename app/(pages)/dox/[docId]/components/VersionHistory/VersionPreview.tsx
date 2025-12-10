"use client";

import { useDocsStore } from "../../store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function VersionPreview() {
  const store = useDocsStore();
  const { versions, selectedVersionId, selectVersion } = store;

  const version = versions.find((v) => v.id === selectedVersionId);
  if (!version) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Version Preview</h2>
          <Button variant="ghost" size="icon" onClick={() => selectVersion(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {version.content}
            </pre>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
