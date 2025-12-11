"use client";

import { useEffect } from "react";
import { useDocsStore } from "../../store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function VersionCompare() {
  const store = useDocsStore();
  const { docId, compareFromVersionId, selectedVersionId, setCompareMode } = store;

  // TODO: Fetch comparison data
  // For now, just show placeholder

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Compare Versions</h2>
          <Button variant="ghost" size="icon" onClick={() => setCompareMode(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          <ScrollArea>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-sm font-medium mb-2">From Version</h3>
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {/* Version content */}
              </pre>
            </div>
          </ScrollArea>
          <ScrollArea>
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-sm font-medium mb-2">To Version</h3>
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {/* Version content */}
              </pre>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
