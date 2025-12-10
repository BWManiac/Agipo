"use client";

import { useBrowserStore, type ActionLogEntry, type ActionType } from "../../store";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";

const ACTION_ICONS: Record<ActionType, string> = {
  navigate: "globe",
  click: "pointer",
  type: "keyboard",
  extract: "file-text",
  screenshot: "camera",
  download: "download",
  wait: "clock",
  action: "zap",
};

const ACTION_EMOJIS: Record<ActionType, string> = {
  navigate: "????",
  click: "????",
  type: "??????",
  extract: "????",
  screenshot: "????",
  download: "??????",
  wait: "???",
  action: "???",
};

const ACTION_COLORS: Record<string, string> = {
  running: "bg-blue-50 border-blue-200",
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  pending: "bg-gray-50 border-gray-200",
};

interface ActionEntryProps {
  action: ActionLogEntry;
}

export function ActionEntry({ action }: ActionEntryProps) {
  const expandedActionId = useBrowserStore((state) => state.expandedActionId);
  const toggleActionExpanded = useBrowserStore(
    (state) => state.toggleActionExpanded
  );

  const isExpanded = expandedActionId === action.id;

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "border-l-4 cursor-pointer transition-colors hover:bg-opacity-80",
        ACTION_COLORS[action.status]
      )}
      onClick={() => toggleActionExpanded(action.id)}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <span className="text-lg">{ACTION_EMOJIS[action.type]}</span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm capitalize">
                {action.type}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {action.target}
              </span>
            </div>
          </div>

          {/* Status & Duration */}
          <div className="flex items-center gap-2 shrink-0">
            {action.duration && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(action.duration)}
              </span>
            )}
            <StatusIcon status={action.status} />
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-dashed space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{formatTime(action.timestamp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target</span>
              <span className="text-right max-w-[200px] truncate font-mono text-xs">
                {action.target}
              </span>
            </div>
            {action.duration && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{formatDuration(action.duration)}</span>
              </div>
            )}
            {action.error && (
              <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                {action.error}
              </div>
            )}
            {action.details && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(action.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ActionLogEntry["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    case "success":
      return <Check className="w-4 h-4 text-green-500" />;
    case "error":
      return <X className="w-4 h-4 text-red-500" />;
    case "pending":
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    default:
      return null;
  }
}
