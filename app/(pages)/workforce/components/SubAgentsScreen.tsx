"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AgentConfig } from "@/_tables/types";

interface SubAgentsScreenProps {
  currentAgentId: string;
  selectedSubAgentIds: string[];
  onSave: (subAgentIds: string[]) => void;
  onCancel: () => void;
}

export function SubAgentsScreen({
  currentAgentId,
  selectedSubAgentIds,
  onSave,
  onCancel,
}: SubAgentsScreenProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(selectedSubAgentIds)
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/workforce");
        if (response.ok) {
          const data = await response.json();
          // Filter out the current agent (can't be its own sub-agent)
          // Only filter if currentAgentId is a real UUID (not "temp")
          const otherAgents =
            currentAgentId && currentAgentId !== "temp"
              ? (data.agents || []).filter(
                  (agent: AgentConfig) => agent.id !== currentAgentId
                )
              : data.agents || [];
          setAgents(otherAgents);
        }
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [currentAgentId]);

  const handleToggle = (agentId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    setSelectedIds(newSet);
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="space-y-6 py-8">
        <div>
          <h2 className="text-lg font-semibold">Select Sub-Agents</h2>
          <p className="text-sm text-muted-foreground">
            Choose which agents this manager agent can delegate to
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No other agents available. Create more agents first to set up a manager-sub-agent relationship.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <div>
        <h2 className="text-lg font-semibold">Select Sub-Agents</h2>
        <p className="text-sm text-muted-foreground">
          Choose which agents this manager agent can delegate to
        </p>
      </div>

      <div className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={`sub-agent-${agent.id}`}
              checked={selectedIds.has(agent.id)}
              onCheckedChange={() => handleToggle(agent.id)}
            />
            <Label
              htmlFor={`sub-agent-${agent.id}`}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.avatar}</span>
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">{agent.role}</div>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save ({selectedIds.size} selected)
        </Button>
      </div>
    </div>
  );
}
