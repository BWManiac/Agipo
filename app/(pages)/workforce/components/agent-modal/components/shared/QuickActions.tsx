"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Activity, FileText } from "lucide-react";
import type { TabId } from "../../AgentModal";

interface QuickActionsProps {
  onTabChange: (id: TabId) => void;
}

export function QuickActions({ onTabChange }: QuickActionsProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    // In a real app, we'd pass this message to the Chat tab via context/props
    console.log("Sending quick message:", message);
    setMessage("");
    onTabChange("chat");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Start Conversation</h3>
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask Mira to do something..."
          className="w-full border border-gray-200 rounded-lg p-3 pr-12 text-sm focus-visible:ring-2 focus-visible:ring-black/5 resize-none h-20 shadow-none min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          size="icon"
          className="absolute bottom-3 right-3 h-7 w-7 bg-black text-white hover:bg-gray-800 rounded-md"
          onClick={handleSend}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded border border-gray-200 transition-colors">
          <Activity className="h-3 w-3" />
          Run Standup
        </button>
        <button className="flex items-center gap-1.5 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded border border-gray-200 transition-colors">
          <FileText className="h-3 w-3" />
          Draft Report
        </button>
      </div>
    </div>
  );
}

