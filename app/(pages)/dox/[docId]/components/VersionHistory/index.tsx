"use client";

import { useEffect } from "react";
import { useDocsStore } from "../../store";
import { VersionItem } from "./VersionItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export function VersionHistory() {
  const store = useDocsStore();
  const { docId, versions, isLoading, loadVersions } = store;

  useEffect(() => {
    if (docId) {
      loadVersions(docId);
    }
  }, [docId, loadVersions]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <History className="w-4 h-4" />
        <h2 className="font-semibold text-sm">Version History</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Loading versions...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No versions yet
            </div>
          ) : (
            versions.map((version) => (
              <VersionItem key={version.id} version={version} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
