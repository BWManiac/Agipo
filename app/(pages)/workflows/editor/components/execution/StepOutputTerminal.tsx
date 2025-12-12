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
 * Get a clean one-line preview of output for collapsed state.
 */
function getPreviewText(output: unknown): string {
  if (output === undefined || output === null) return "";

  if (typeof output === "string") {
    // Truncate long strings
    return output.length > 80 ? output.slice(0, 80) + "..." : output;
  }

  if (typeof output === "object") {
    // Show object keys as preview
    const keys = Object.keys(output as object);
    if (keys.length === 0) return "{}";
    if (keys.length === 1) {
      const val = (output as Record<string, unknown>)[keys[0]];
      if (typeof val === "string" && val.length < 60) {
        return `{ ${keys[0]}: "${val.slice(0, 50)}${val.length > 50 ? "..." : ""}" }`;
      }
      return `{ ${keys[0]}: ... }`;
    }
    return `{ ${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", ..." : ""} }`;
  }

  return String(output);
}

/**
 * Terminal-style component for displaying step output.
 * Shows truncated JSON with expand/collapse and copy functionality.
 */
export function StepOutputTerminal({
  output,
  maxHeight = 200,
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

  // Get clean preview text
  const previewText = getPreviewText(output);

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
    <div className="rounded border border-muted/60 bg-muted/20 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="flex-shrink-0">Output</span>
          {!isExpanded && previewText && (
            <span className="font-mono text-muted-foreground/70 truncate ml-1">
              {previewText}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-2.5 pb-2.5 overflow-auto border-t border-muted/40"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all pt-2">
            {outputStr}
          </pre>
        </div>
      )}
    </div>
  );
}
