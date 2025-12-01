"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ToolInspector } from "../ToolInspector";
import { ToolEditor } from "../ToolEditor";
import { useAgentTools, toAgentToolId, normalizeToolId } from "./hooks/useAgentTools";
import { AgentHeader } from "./components/AgentHeader";
import { AgentChatSection } from "./components/AgentChatSection";
import { AgentInfoPanel } from "./components/info-panel/AgentInfoPanel";
import type { AgentConfig } from "@/_tables/types";

export type AgentModalProps = {
  agent: AgentConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AgentModal({ agent, open, onOpenChange }: AgentModalProps) {
  const [feedback, setFeedback] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [toolOpen, setToolOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [toolEditorOpen, setToolEditorOpen] = useState(false);

  const { agentTools, allTools, isLoading, error } = useAgentTools(agent);

  if (!agent) {
    return null;
  }

  const selectedTool = selectedToolId
    ? (() => {
        const normalizedId = normalizeToolId(selectedToolId);
        const tool = allTools.find((t) => t.id === normalizedId);
        return tool ? { ...tool, runtime: "internal" as const } : null;
      })()
    : null;

  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) return;
    // Persistence logic placeholder
    setFeedback("");
  };

  const handleSaveTools = async (toolIds: string[]) => {
    const response = await fetch(`/api/workforce/${agent.id}/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to save tools`);
    }

    // Reload page to reflect changes
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[90vw] md:max-w-[1200px] xl:max-w-[1400px] overflow-hidden rounded-3xl p-0">
        <AgentHeader agent={agent} />
        <Separator className="my-6" />
        
        <div className="flex h-[78vh] flex-col md:flex-row">
          <AgentChatSection
            agent={agent}
            queuedPrompt={queuedPrompt}
            onQueuePrompt={setQueuedPrompt}
          />
          
          <AgentInfoPanel
            agent={agent}
            tools={agentTools}
            isLoadingTools={isLoading}
            toolsError={error}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onFeedbackSubmit={handleFeedbackSubmit}
            onSelectTool={(id) => {
              // Store with workflow- prefix to match agent.toolIds format
              setSelectedToolId(toAgentToolId(id));
              setToolOpen(true);
            }}
            onEditTools={() => setToolEditorOpen(true)}
          />
        </div>

        <ToolInspector
          tool={selectedTool}
          open={toolOpen}
          onOpenChange={(open) => {
            setToolOpen(open);
            if (!open) setSelectedToolId(null);
          }}
        />
        <ToolEditor
          agent={agent}
          open={toolEditorOpen}
          onOpenChange={setToolEditorOpen}
          onSave={handleSaveTools}
        />
      </DialogContent>
    </Dialog>
  );
}

