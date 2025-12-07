"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { useWorkflowsDStore } from "../../store";

export function ChatPanel() {
  const { chatMessages, isChatLoading, addChatMessage, setChatLoading, workflow, steps, mappings } = useWorkflowsDStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user" as const,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    const currentInput = input.trim();
    setInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/workflows-d/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          workflowContext: {
            id: workflow?.id || "",
            name: workflow?.name || "Untitled Workflow",
            steps: steps.map((s) => ({ id: s.id, name: s.name, type: s.type, toolId: s.toolId })),
            mappings: mappings.map((m) => ({ source: m.sourceStepId, target: m.targetStepId })),
          },
          conversationHistory: chatMessages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant" as const,
        content: data.message,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant" as const,
        content: "I apologize, but I encountered an error. Please try again or use the Tools panel to add steps manually.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMessage);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-xs text-slate-400">Build workflows with natural language</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-500/10 mb-3">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <p className="text-sm text-slate-400 max-w-[200px] mx-auto">
              Describe what you want to automate, and I&apos;ll help you build it.
            </p>
          </div>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div 
                className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center ${
                  message.role === "user" 
                    ? "bg-violet-500/20" 
                    : "bg-slate-700"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5 text-violet-400" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-slate-300" />
                )}
              </div>
              <div 
                className={`flex-1 p-3 rounded-xl text-sm ${
                  message.role === "user"
                    ? "bg-violet-500/10 text-violet-100 border border-violet-500/20"
                    : "bg-slate-800/50 text-slate-200 border border-white/5"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        
        {isChatLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 text-slate-300 animate-spin" />
            </div>
            <div className="flex-1 p-3 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your workflow..."
            className="w-full h-11 pl-4 pr-12 bg-slate-800/50 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
            disabled={isChatLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isChatLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}



