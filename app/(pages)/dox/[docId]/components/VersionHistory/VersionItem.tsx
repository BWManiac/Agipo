"use client";

import { useDocsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Eye } from "lucide-react";

// DocumentVersion type (matches versionSlice)
interface DocumentVersion {
  id: string;
  docId: string;
  content: string;
  properties: Record<string, unknown>;
  wordCount: number;
  wordsDelta: number;
  summary: string;
  createdAt: string;
  createdBy: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
}

interface VersionItemProps {
  version: DocumentVersion;
}

export function VersionItem({ version }: VersionItemProps) {
  const store = useDocsStore();
  const { docId, restoreVersion, selectVersion } = store;

  const handleRestore = async () => {
    if (!docId) return;
    if (confirm("Restore this version? This will create a new version.")) {
      await restoreVersion(docId, version.id);
    }
  };

  const handlePreview = () => {
    selectVersion(version.id);
  };

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{version.summary}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePreview}
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRestore}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          {version.wordCount} words
          {version.wordsDelta !== 0 && (
            <span className={version.wordsDelta > 0 ? "text-green-600" : "text-red-600"}>
              {" "}({version.wordsDelta > 0 ? "+" : ""}{version.wordsDelta})
            </span>
          )}
        </span>
        <span>
          {version.createdBy.type === "agent" ? "🤖" : "👤"} {version.createdBy.name}
        </span>
      </div>
    </div>
  );
}
