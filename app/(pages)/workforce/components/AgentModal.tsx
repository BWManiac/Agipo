"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentConfig, WorkflowSummary } from "@/_tables/types";
import { AgentChat } from "./AgentChat";
import { ToolInspector } from "./ToolInspector";
import { ToolEditor } from "./ToolEditor";

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
  const [allTools, setAllTools] = useState<WorkflowSummary[]>([]);
  const [toolsLoadError, setToolsLoadError] = useState<string | null>(null);
  const [isLoadingToolsState, setIsLoadingToolsState] = useState(true);

  // Load tools when agent changes or on mount
  useEffect(() => {
    if (!agent) {
      setAllTools([]);
      setToolsLoadError(null);
      setIsLoadingToolsState(false);
      return;
    }
    
    const fetchTools = async () => {
      setIsLoadingToolsState(true);
      setToolsLoadError(null);
      
      try {
        const response = await fetch("/api/tools/list");
        
        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: Failed to fetch tools`;
          console.error("[AgentModal] API error:", errorMsg);
          throw new Error(errorMsg);
        }
        
        const tools = await response.json();
        const toolList = Array.isArray(tools) ? tools : [];
        setAllTools(toolList);
        setToolsLoadError(null);
        
        // Debug logging
        console.log(`[AgentModal] Loaded ${toolList.length} tool definitions`);
        console.log(`[AgentModal] Agent ${agent.id} has toolIds:`, agent.toolIds);
        
        // Normalize agent toolIds and match against list
        const normalizeId = (id: string) => id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
        const normalizedAgentToolIds = agent.toolIds.map(normalizeId);
        const matched = normalizedAgentToolIds
          .map((normalizedId) => toolList.find((t) => t.id === normalizedId))
          .filter((t): t is WorkflowSummary => t !== undefined);
        console.log(`[AgentModal] Matched ${matched.length} tools for agent ${agent.id}`);
      } catch (error) {
        console.error("[AgentModal] Error fetching tools:", error);
        setToolsLoadError(error instanceof Error ? error.message : "Failed to load tools");
        setAllTools([]); // Clear tools on error so we don't stay in loading state
      } finally {
        setIsLoadingToolsState(false);
      }
    };
    fetchTools();
  }, [agent]); // Reload when agent changes

  if (!agent) {
    return null;
  }

  // Normalize tool ID helper
  const normalizeToolId = (id: string): string => {
    return id.startsWith("workflow-") ? id.slice("workflow-".length) : id;
  };

  // Match agent toolIds with tool definitions (normalize IDs for comparison)
  const normalizedAgentToolIds = agent.toolIds.map(normalizeToolId);
  const tools = normalizedAgentToolIds
    .map((normalizedId) => allTools.find((t) => t.id === normalizedId))
    .filter((t): t is WorkflowSummary => t !== undefined);
    
  // Convert WorkflowSummary to format expected by ToolInspector (id, name, description, runtime)
  const selectedTool = selectedToolId 
    ? (() => {
        const normalizedId = normalizeToolId(selectedToolId);
        const tool = allTools.find((t) => t.id === normalizedId);
        return tool ? { ...tool, runtime: "internal" as const } : null;
      })()
    : null;
  
  // Use explicit loading state instead of inferring from empty array
  // This prevents getting stuck in loading state if API fails

  const handleFeedbackSubmit = () => {
    if (!feedback.trim()) return;
    // For demo purposes we simply clear the textarea—persistence would hook into API later.
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
        <DialogHeader className="px-8 pt-8">
          <DialogTitle className="flex items-center gap-4 text-2xl">
            <span className="text-3xl leading-none">{agent.avatar}</span>
            <span>
              {agent.name}
              <span className="block text-base font-normal text-muted-foreground">{agent.role}</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{agent.description}</DialogDescription>
        </DialogHeader>
        <Separator className="my-6" />
        <div className="flex h-[78vh] flex-col md:flex-row">
          <div className="flex flex-[1.6] flex-col border-border md:border-r">
            <div className="space-y-2 px-8 pb-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Quick prompts
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setQueuedPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
            <AgentChat
              className="flex-1"
              agentId={agent.id}
              agentName={agent.name}
              defaultPrompt={agent.highlight}
              queuedPrompt={queuedPrompt}
              onPromptConsumed={() => setQueuedPrompt(null)}
            />
          </div>
          <div className="flex w-full max-w-[560px] flex-col">
            <ScrollArea className="h-full px-8 pb-8">
              <Section heading="Objectives" items={agent.objectives} />
              <Section heading="Guardrails" items={agent.guardrails} />
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Insights &amp; signals
                </h3>
                <div className="grid gap-3">
                  {agent.insights.map((insight) => (
                    <div key={insight.title} className="rounded-xl border border-border bg-muted/40 p-4">
                      <Badge variant="outline" className="mb-2 uppercase tracking-[0.16em]">
                        {insight.type}
                      </Badge>
                      <h4 className="text-base font-semibold text-foreground">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tool usage
                </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setToolEditorOpen(true)}
                  >
                    Edit tools
                  </Button>
                </div>
                {isLoadingToolsState ? (
                  <div className="rounded-xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">
                    Loading tools...
                  </div>
                ) : toolsLoadError ? (
                  <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
                    <p className="text-sm font-medium text-destructive">Failed to load tools</p>
                    <p className="mt-1 text-xs text-muted-foreground">{toolsLoadError}</p>
                  </div>
                ) : tools.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
                    <p className="text-sm font-medium text-foreground">No tools assigned</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click &quot;Edit tools&quot; to assign tools to this agent.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="rounded-xl border border-border bg-background p-4">
                        <button
                          className="flex w-full items-start justify-between gap-4 text-left"
                          onClick={() => {
                            // Store with workflow- prefix to match agent.toolIds format
                            setSelectedToolId(`workflow-${tool.id}`);
                            setToolOpen(true);
                          }}
                        >
                          <div>
                            <h4 className="font-semibold text-foreground underline-offset-4 hover:underline">
                              {tool.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>—</div>
                            <div>—</div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Recent activity
                </h3>
                <div className="space-y-3">
                  {agent.activities.map((activity) => (
                    <div key={activity.title} className="rounded-xl border border-border bg-background p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {activity.timestamp}
                      </div>
                      <h4 className="mt-2 text-base font-semibold text-foreground">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">{activity.summary}</p>
                      <p className="mt-2 text-sm font-medium text-foreground">Impact: {activity.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Assigned workflows
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {agent.assignedWorkflows.map((workflow) => (
                    <li key={workflow}>• {workflow}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Feedback log
                </h3>
                <div className="space-y-3">
                  {agent.feedback.map((item) => (
                    <div key={item.comment} className="rounded-xl border border-border bg-background p-4 text-sm">
                      <div className="font-semibold text-foreground">{item.author}</div>
                      <p className="text-muted-foreground">{item.comment}</p>
                      <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {item.timestamp}
                      </div>
                    </div>
                  ))}
                  {agent.feedback.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No feedback yet.</p>
                  ) : null}
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleFeedbackSubmit();
                  }}
                >
                  <Textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="Leave feedback for this agent"
                    className="min-h-[80px]"
                  />
                  <Button type="submit" className="w-full">
                    Submit feedback
                  </Button>
                </form>
              </div>
            </ScrollArea>
          </div>
        </div>
        <ToolInspector
          tool={selectedTool}
          open={toolOpen}
          onOpenChange={(open) => {
            setToolOpen(open);
            if (!open) {
              setSelectedToolId(null);
            }
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

function Section({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {heading}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="border border-border">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}


