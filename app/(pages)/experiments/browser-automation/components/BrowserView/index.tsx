"use client";

import { useBrowserStore } from "../../store";
import { BrowserChrome } from "./BrowserChrome";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";

export function BrowserView() {
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const liveViewUrl = useBrowserStore((state) => state.liveViewUrl);
  const browserError = useBrowserStore((state) => state.browserError);

  // No session selected
  if (!activeSessionId) {
    return <EmptyState />;
  }

  // Error state
  if (browserError) {
    return <ErrorState />;
  }

  // No live view URL yet - show loading
  if (!liveViewUrl) {
    return <LoadingState />;
  }

  // Has URL - show browser (it'll connect/load in the iframe)
  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Browser Chrome (URL bar, controls) */}
      <BrowserChrome />

      {/* Browser Iframe */}
      <div className="flex-1 relative bg-white">
        <iframe
          src={liveViewUrl}
          sandbox="allow-same-origin allow-scripts"
          allow="clipboard-read; clipboard-write"
          style={{
            border: 0,
            display: "block",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}
