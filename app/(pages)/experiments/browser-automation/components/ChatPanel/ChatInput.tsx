"use client";

import { useState, useRef, useEffect } from "react";
import { useBrowserStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Square } from "lucide-react";

export function ChatInput() {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const isStreaming = useBrowserStore((state) => state.isStreaming);
  const sendMessage = useBrowserStore((state) => state.sendMessage);
  const stopTask = useBrowserStore((state) => state.stopTask);

  const disabled = !activeSessionId;

  const handleSend = () => {
    if (value.trim() && !disabled && !isStreaming && activeSessionId) {
      sendMessage(activeSessionId, value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift: Send message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter: New line (default behavior)
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [value]);

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Select a session first..."
              : isStreaming
              ? "Agent is working..."
              : "Type a command..."
          }
          disabled={disabled || isStreaming}
          className="flex-1 min-h-[44px] max-h-32 px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
          rows={1}
        />

        {isStreaming ? (
          <Button
            onClick={stopTask}
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
