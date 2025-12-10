"use client";

import { useState, useRef, useEffect } from "react";
import { useBrowserStore } from "../../store";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Maximize2 } from "lucide-react";

export function BrowserChrome() {
  const currentUrl = useBrowserStore((state) => state.currentUrl);
  const liveViewUrl = useBrowserStore((state) => state.liveViewUrl);
  const status = useBrowserStore((state) => state.status);
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const sendMessage = useBrowserStore((state) => state.sendMessage);
  const isStreaming = useBrowserStore((state) => state.isStreaming);

  const [isEditing, setIsEditing] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenExternal = () => {
    if (liveViewUrl) {
      window.open(liveViewUrl, "_blank");
    }
  };

  const handleUrlBarClick = () => {
    if (status === "connected" && activeSessionId) {
      setIsEditing(true);
      setUrlValue(currentUrl || "");
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim() && activeSessionId && !isStreaming) {
      let url = urlValue.trim();
      // Auto-prepend https:// if no protocol
      if (!url.match(/^https?:\/\//)) {
        url = `https://${url}`;
      }
      sendMessage(activeSessionId, `Navigate to ${url}`);
      setIsEditing(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleUrlSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="h-12 bg-white border-b flex items-center gap-2 px-4 shrink-0">
      {/* URL Bar */}
      <div className="flex-1 flex items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            onBlur={() => setIsEditing(false)}
            className="flex-1 h-8 px-3 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Enter URL..."
          />
        ) : (
          <div
            onClick={handleUrlBarClick}
            className={`flex-1 h-8 px-3 bg-gray-100 rounded-md flex items-center text-sm ${
              status === "connected" ? "cursor-text hover:bg-gray-200" : ""
            }`}
          >
            <span className="text-muted-foreground truncate">
              {currentUrl || "about:blank"}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Refresh"
          disabled={status !== "connected"}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Open in new tab"
          onClick={handleOpenExternal}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Fullscreen"
          onClick={handleOpenExternal}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground border-l pl-4 ml-2">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "connected" ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        <span className="capitalize">{status}</span>
      </div>
    </div>
  );
}
