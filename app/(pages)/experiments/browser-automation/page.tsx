"use client";

import { useEffect } from "react";
import { useBrowserStore } from "./store";
import { SessionsSidebar } from "./components/SessionsSidebar";
import { BrowserView } from "./components/BrowserView";
import { ChatPanel } from "./components/ChatPanel";
import { ProfileDialog } from "./components/Profiles";
import { useKeyboardShortcuts } from "./hooks";

export default function BrowserAutomationPage() {
  const fetchSessions = useBrowserStore((state) => state.fetchSessions);

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
