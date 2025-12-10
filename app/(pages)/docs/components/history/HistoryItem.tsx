"use client";

import { User, Bot, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useDocsStore } from "../../store";
import type { DocumentVersion } from "@/app/api/docs/services/types";
import { useState } from "react";
import { RestoreDialog } from "./RestoreDialog";

interface HistoryItemProps {
  version: DocumentVersion;
  docId: string;
}

export function HistoryItem({ version, docId }: HistoryItemProps) {
  const previewVersion = useDocsStore((state) => state.previewVersion);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const isAgent = version.author.type === "agent";

  return (
    <>
      <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isAgent ? "bg-purple-100 dark:bg-purple-900" : "bg-muted"
          }`}
        >
          {isAgent ? (
            <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{version.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(version.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>

          {version.summary && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {version.summary}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {version.wordCount.toLocaleString()} words
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => previewVersion(docId, version.id)}
            title="Preview this version"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowRestoreDialog(true)}
            title="Restore this version"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <RestoreDialog
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        docId={docId}
        versionId={version.id}
      />
    </>
  );
}
