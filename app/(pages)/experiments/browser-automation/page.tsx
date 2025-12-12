"use client";

import { useEffect, useRef } from "react";
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
  // #region agent log
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'browser-automation/page.tsx:15',message:'Component render',data:{renderCount:renderCountRef.current,timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const fetchSessions = useBrowserStore((state) => state.fetchSessions);
  
  // #region agent log
  const fetchSessionsRef = useRef(fetchSessions);
  const functionChanged = fetchSessionsRef.current !== fetchSessions;
  if (functionChanged) fetchSessionsRef.current = fetchSessions;
  fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'browser-automation/page.tsx:23',message:'fetchSessions function reference check',data:{functionChanged,renderCount:renderCountRef.current},sessionId:'debug-session',runId:'run1',hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  // Enable global keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    // Skip if we've fetched recently (prevents duplicate calls during HMR remounts)
    if (timeSinceLastFetch < FETCH_COOLDOWN_MS) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'browser-automation/page.tsx:34',message:'Skipping fetchSessions - cooldown active',data:{renderCount:renderCountRef.current,timeSinceLastFetch},sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'D',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }
    
    lastFetchTime = now;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'browser-automation/page.tsx:43',message:'useEffect running - calling fetchSessions',data:{renderCount:renderCountRef.current,functionChanged},sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
