"use client";

import { useBrowserStore } from "../../store";
import { Button } from "@/components/ui/button";

const ERROR_CONFIG = {
  timeout: {
    icon: "clock",
    title: "Session Timed Out",
    description: "This session was closed due to inactivity.",
    showReconnect: true,
    tips: [
      "Increase idle timeout in session settings",
      "Keep the browser active to prevent timeout",
    ],
  },
  disconnected: {
    icon: "wifi-off",
    title: "Connection Lost",
    description: "The connection to the browser was interrupted.",
    showReconnect: true,
    tips: [
      "Check your internet connection",
      "The browser session may still be running",
    ],
  },
  service_error: {
    icon: "wrench",
    title: "Service Unavailable",
    description: "The browser service is temporarily unavailable.",
    showReconnect: false,
    tips: [
      "Wait a few minutes and try again",
      "Check status.anchorbrowser.io for updates",
    ],
  },
  unknown: {
    icon: "help-circle",
    title: "Something Went Wrong",
    description: "An unexpected error occurred.",
    showReconnect: true,
    tips: ["Try creating a new session", "Refresh the page if problem persists"],
  },
};

export function ErrorState() {
  const browserError = useBrowserStore((state) => state.browserError);
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const sessions = useBrowserStore((state) => state.sessions);
  const createSession = useBrowserStore((state) => state.createSession);
  const openNewSessionDialog = useBrowserStore(
    (state) => state.openNewSessionDialog
  );
  const clearBrowserState = useBrowserStore((state) => state.clearBrowserState);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const errorType = browserError?.type || "unknown";
  const config = ERROR_CONFIG[errorType];

  const handleReconnect = async () => {
    clearBrowserState();
    await createSession(activeSession?.profileName);
  };

  const handleNewSession = () => {
    clearBrowserState();
    openNewSessionDialog();
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">
            {errorType === "timeout" && "???"}
            {errorType === "disconnected" && "????"}
            {errorType === "service_error" && "????"}
            {errorType === "unknown" && "???"}
          </span>
        </div>

        {/* Title & Description */}
        <h2 className="text-xl font-semibold mb-2">{config.title}</h2>
        <p className="text-muted-foreground mb-6">
          {browserError?.message || config.description}
        </p>

        {/* Error Code */}
        {browserError?.code && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-mono text-red-700">{browserError.code}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-8">
          {config.showReconnect && (
            <Button onClick={handleReconnect}>
              Reconnect
              {activeSession?.profileName && (
                <span className="ml-1 opacity-75">
                  ({activeSession.profileName})
                </span>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleNewSession}>
            New Session
          </Button>
        </div>

        {/* Troubleshooting Tips */}
        <div className="text-left">
          <p className="text-sm font-medium mb-2">Troubleshooting</p>
          <ul className="space-y-2">
            {config.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
