"use client";

import { useEffect } from "react";
import { useBrowserStore } from "./store";
import { SessionsSidebar } from "./components/SessionsSidebar";
import { BrowserView } from "./components/BrowserView";
import { ChatPanel } from "./components/ChatPanel";
import { ProfileDialog } from "./components/Profiles";
import { useKeyboardShortcuts } from "./hooks";

// Module-level flag to prevent duplicate fetches during rapid remounts (HMR)
let lastFetchTime = 0;
const FETCH_COOLDOWN_MS = 2000; // Don't fetch more than once every 2 seconds

export default function BrowserAutomationPage() {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;

    // Skip if we've fetched recently (prevents duplicate calls during HMR remounts)
    if (timeSinceLastFetch < FETCH_COOLDOWN_MS) {
      return;
    }

    lastFetchTime = now;
    // Use getState() to access the store function directly, avoiding dependency on selector result
    useBrowserStore.getState().fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: only run on mount

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50">
      {/* Sessions Sidebar - Far Left (collapsible) */}
      <SessionsSidebar />

      {/* Chat Panel - Left */}
      <ChatPanel />

      {/* Browser View - Right (main view) */}
      <div className="flex-1 flex flex-col min-w-0">
        <BrowserView />
      </div>

      {/* Profile Dialog */}
      <ProfileDialog />
    </div>
  );
}
