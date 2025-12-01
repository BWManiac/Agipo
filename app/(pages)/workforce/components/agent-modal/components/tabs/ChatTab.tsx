"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import type { AgentConfig } from "@/_tables/types";
import { AgentChat } from "../../../AgentChat";

interface ChatTabProps {
  agent: AgentConfig;
}

export function ChatTab({ agent }: ChatTabProps) {
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar: Context */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
        <div className="p-4 space-y-6">
          
          {/* Current Task */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Current Focus</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Synthesising Feedback</span>
              </div>
              <p className="text-[10px] text-gray-500">Reading &quot;QBR Recordings&quot; table to extract themes.</p>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent Conversations</h3>
            <ul className="space-y-1">
              <li className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 p-2 rounded cursor-pointer font-medium text-blue-700">
                <MessageSquare className="h-3 w-3 text-blue-500" />
                Admin Dashboard Latency
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                Onboarding Launch Plan
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600 bg-white border border-gray-200 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                Daily Standup (Oct 24)
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        <AgentChat
          className="flex-1 h-full"
          agentId={agent.id}
          agentName={agent.name}
          defaultPrompt={agent.highlight}
          queuedPrompt={queuedPrompt}
          onPromptConsumed={() => setQueuedPrompt(null)}
        />
      </div>
    </div>
  );
}

