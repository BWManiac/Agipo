"use client";

import { useState } from "react";
import { MessageSquare, Send, ChevronLeft, ChevronRight } from "lucide-react";

export function EditorSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages] = useState([
    {
      role: "assistant" as const,
      content: "I can help you build this workflow! What would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");

  if (isCollapsed) {
    return (
      <aside className="w-12 border-r border-slate-700 bg-slate-800/30 flex flex-col items-center py-3 shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="mt-4 p-2 text-slate-500">
          <MessageSquare className="h-5 w-5" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-slate-700 bg-slate-800/30 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg text-sm ${
              message.role === "assistant"
                ? "bg-slate-700/50 text-slate-200"
                : "bg-cyan-600/20 text-cyan-100 ml-4"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg border border-slate-600 p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for help..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}




