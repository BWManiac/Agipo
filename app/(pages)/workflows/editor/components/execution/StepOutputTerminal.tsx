"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepOutputTerminalProps {
  output: unknown;
  maxHeight?: number;
  defaultExpanded?: boolean;
}

/**
 * Terminal-style component for displaying step output.
 * Shows truncated JSON with expand/collapse and copy functionality.
 */
export function StepOutputTerminal({
  output,
  maxHeight = 150,
  defaultExpanded = false,
}: StepOutputTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  if (output === undefined || output === null) {
    return null;
  }

  // Format output as JSON string
  const outputStr = typeof output === "string"
    ? output
    : JSON.stringify(output, null, 2);

  // Truncate for preview (first 200 chars)
  const truncatedOutput = outputStr.length > 200
    ? outputStr.slice(0, 200) + "..."
    : outputStr;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-2 rounded border border-muted bg-muted/30">
      {/* Header */}
      <div
        className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>Output</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          className="px-2 pb-2 overflow-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
            {outputStr}
          </pre>
        </div>
      )}

      {/* Collapsed preview */}
      {!isExpanded && outputStr.length > 0 && (
        <div className="px-2 pb-1">
          <pre className="text-xs font-mono text-muted-foreground truncate">
            {truncatedOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
