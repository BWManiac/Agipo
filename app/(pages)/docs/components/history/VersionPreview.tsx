"use client";

import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocsStore } from "../../store";
import { useState } from "react";
import { RestoreDialog } from "./RestoreDialog";

interface VersionPreviewProps {
  docId: string;
}

export function VersionPreview({ docId }: VersionPreviewProps) {
  const previewDocument = useDocsStore((state) => state.previewDocument);
  const selectedVersionId = useDocsStore((state) => state.selectedVersionId);
  const clearPreview = useDocsStore((state) => state.clearPreview);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  if (!previewDocument) return null;

  return (
    <>
      <Dialog open={!!previewDocument} onOpenChange={() => clearPreview()}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Version Preview: {previewDocument.frontmatter.title}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRestoreDialog(true)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            <div className="prose prose-slate dark:prose-invert max-w-none p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {previewDocument.content}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedVersionId && (
        <RestoreDialog
          open={showRestoreDialog}
          onOpenChange={setShowRestoreDialog}
          docId={docId}
          versionId={selectedVersionId}
        />
      )}
    </>
  );
}
