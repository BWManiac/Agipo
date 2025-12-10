"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToolsSearchInput } from "./ToolsSearchInput";
import { ToolEditor } from "../ToolEditor";
import { ConnectionToolEditorPanel } from "../ConnectionToolEditorPanel";
import type { AgentConfig, ConnectionToolBinding, WorkflowSummary } from "@/_tables/types";

interface CapabilitiesStepProps {
  formData: {
    toolIds: string[];
    connectionToolBindings: ConnectionToolBinding[];
    workflows: string[];
  };
  onUpdate: (updates: Partial<CapabilitiesStepProps["formData"]>) => void;
  onSkip: () => void;
}

type ViewState = "main" | "custom-tools" | "connection-tools";

export function CapabilitiesStep({
  formData,
  onUpdate,
  onSkip,
}: CapabilitiesStepProps) {
  const [view, setView] = useState<ViewState>("main");
  const [availableTools, setAvailableTools] = useState<
    Array<{ id: string; name: string; description: string }>
  >([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available tools and workflows
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load custom tools
        const toolsRes = await fetch("/api/tools/list");
        if (toolsRes.ok) {
          const tools = await toolsRes.json();
          setAvailableTools(
            Array.isArray(tools)
              ? tools.map((t: WorkflowSummary) => ({
                  id: t.id,
                  name: t.name,
                  description: t.description || "",
                }))
              : []
          );
        }

        // Load workflows (using same endpoint for now)
        const workflowsRes = await fetch("/api/tools/list");
        if (workflowsRes.ok) {
          const workflows = await workflowsRes.json();
          setAvailableWorkflows(Array.isArray(workflows) ? workflows : []);
        }
      } catch (error) {
        console.error("Failed to load capabilities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create a temporary agent config for ToolEditor and ConnectionToolEditorPanel
  const tempAgent: AgentConfig = {
    id: "temp",
    name: "Temp",
    role: "Temp",
    avatar: "🤖",
    status: "active",
    description: "",
    systemPrompt: "",
    model: "google/gemini-2.5-pro",
    toolIds: formData.toolIds,
    connectionToolBindings: formData.connectionToolBindings,
    quickPrompts: [],
    objectives: [],
    guardrails: [],
    highlight: "",
    lastActivity: new Date().toISOString(),
    metrics: [],
    assignedWorkflows: formData.workflows,
    capabilities: [],
    insights: [],
    activities: [],
    feedback: [],
  };

  const handleSaveCustomTools = async (toolIds: string[]) => {
    onUpdate({ toolIds });
    setView("main");
  };

  const handleSaveConnectionTools = async (bindings: ConnectionToolBinding[]) => {
    onUpdate({ connectionToolBindings: bindings });
    setView("main");
  };

  if (view === "custom-tools") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Custom Tools</h2>
          <p className="text-sm text-muted-foreground">
            Select custom tools (workflows) for this agent
          </p>
        </div>
        <ToolEditor
          agent={tempAgent}
          open={true}
          onOpenChange={(open) => {
            if (!open) setView("main");
          }}
          onSave={handleSaveCustomTools}
        />
      </div>
    );
  }

  if (view === "connection-tools") {
    return (
      <div className="space-y-4">
        <ConnectionToolEditorPanel
          agent={tempAgent}
          onBack={() => setView("main")}
          onSave={handleSaveConnectionTools}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Capabilities (Optional)</h2>
        <p className="text-sm text-muted-foreground">
          Configure what your agent can do. You can skip this and add capabilities later.
        </p>
      </div>

      <div className="space-y-6">
        {/* Custom Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Custom Tools</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("custom-tools")}
            >
              Manage Tools
            </Button>
          </div>
          {formData.toolIds.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              {formData.toolIds.length} tool{formData.toolIds.length !== 1 ? "s" : ""} selected
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No custom tools selected
            </p>
          )}
        </div>

        {/* Connection Tools */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Connection Tools</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView("connection-tools")}
            >
              Manage Connections
            </Button>
          </div>
          {formData.connectionToolBindings.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              {formData.connectionToolBindings.length} connection tool
              {formData.connectionToolBindings.length !== 1 ? "s" : ""} selected
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No connection tools selected
            </p>
          )}
        </div>

        {/* Workflows */}
        <div className="space-y-3">
          <Label>Workflows</Label>
          {formData.workflows.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              {formData.workflows.length} workflow
              {formData.workflows.length !== 1 ? "s" : ""} selected
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No workflows selected (workflow assignment coming soon)
            </p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Button variant="outline" onClick={onSkip} className="w-full">
          Skip this step
        </Button>
      </div>
    </div>
  );
}
