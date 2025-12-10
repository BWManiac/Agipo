"use client";

import { useBrowserStore } from "../../store";
import { MessageSquare } from "lucide-react";

const SUGGESTIONS = [
  "Navigate to google.com",
  "Search for 'cute cats'",
  "Click the first result",
  "Get the page title",
  "Take a screenshot",
  "Extract all links on the page",
];

export function ChatEmpty() {
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const sendMessage = useBrowserStore((state) => state.sendMessage);
  const isStreaming = useBrowserStore((state) => state.isStreaming);

  const handleSuggestionClick = (suggestion: string) => {
    if (activeSessionId && !isStreaming) {
      sendMessage(activeSessionId, suggestion);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>

      <h3 className="text-lg font-semibold mb-2">Chat with the browser</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Use natural language to control the browser. Try one of these commands:
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={!activeSessionId || isStreaming}
            className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
