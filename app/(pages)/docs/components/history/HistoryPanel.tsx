"use client";

import { useEffect } from "react";
import { X, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocsStore } from "../../store";
import { HistoryItem } from "./HistoryItem";
import { VersionPreview } from "./VersionPreview";

interface HistoryPanelProps {
  docId: string;
}

export function HistoryPanel({ docId }: HistoryPanelProps) {
  const isHistoryOpen = useDocsStore((state) => state.isHistoryOpen);
  const setHistoryOpen = useDocsStore((state) => state.setHistoryOpen);
  const versions = useDocsStore((state) => state.versions);
  const isLoading = useDocsStore((state) => state.isLoading);
  const fetchVersions = useDocsStore((state) => state.fetchVersions);
  const previewDocument = useDocsStore((state) => state.previewDocument);

  useEffect(() => {
    if (isHistoryOpen) {
      fetchVersions(docId);
    }
  }, [isHistoryOpen, docId, fetchVersions]);

  return (
    <Sheet open={isHistoryOpen} onOpenChange={setHistoryOpen}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No version history yet</p>
              <p className="text-sm">Versions are created when you save changes</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {versions.map((version) => (
                  <HistoryItem key={version.id} version={version} docId={docId} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Version Preview Modal */}
        {previewDocument && <VersionPreview docId={docId} />}
      </SheetContent>
    </Sheet>
  );
}
