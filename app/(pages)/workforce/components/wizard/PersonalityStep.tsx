"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { getAvailableModels, type ModelInfo } from "@/app/api/workforce/[agentId]/chat/services/models";

interface PersonalityStepProps {
  formData: {
    systemPrompt: string;
    model: string;
    objectives: string[];
    guardrails: string[];
    isManager: boolean;
    subAgentIds: string[];
  };
  onUpdate: (updates: Partial<PersonalityStepProps["formData"]>) => void;
  onOpenSubAgents?: () => void;
}

export function PersonalityStep({ formData, onUpdate, onOpenSubAgents }: PersonalityStepProps) {
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  // Get available models directly (no API call needed)
  const models = getAvailableModels();

  const handleObjectivesChange = (value: string) => {
    const objectives = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onUpdate({ objectives });
  };

  const handleGuardrailsChange = (value: string) => {
    const guardrails = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onUpdate({ guardrails });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Personality & Instructions</h2>
        <p className="text-sm text-muted-foreground">
          Define how your agent behaves and what it should do
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="systemPrompt">
            Instructions <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="systemPrompt"
            value={formData.systemPrompt}
            onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
            placeholder="You are a helpful assistant that..."
            className="mt-1 min-h-[120px] font-mono text-sm"
            minLength={10}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 10 characters. Describe the agent's role, behavior, and key instructions.
          </p>
        </div>

        <div>
          <Label htmlFor="model">
            Model <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.model}
            onValueChange={(value) => onUpdate({ model: value })}
          >
            <SelectTrigger id="model" className="mt-1">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.model && (
            <p className="mt-1 text-xs text-muted-foreground">
              {models.find((m) => m.id === formData.model)?.description || ""}
            </p>
          )}
        </div>

        <Collapsible open={objectivesOpen} onOpenChange={setObjectivesOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Objectives (Optional)</span>
              {objectivesOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2">
              <Textarea
                value={formData.objectives.join("\n")}
                onChange={(e) => handleObjectivesChange(e.target.value)}
                placeholder="Enter objectives, one per line:&#10;- Increase user engagement&#10;- Reduce support tickets"
                className="min-h-[80px] text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                One objective per line
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={guardrailsOpen} onOpenChange={setGuardrailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Guardrails (Optional)</span>
              {guardrailsOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2">
              <Textarea
                value={formData.guardrails.join("\n")}
                onChange={(e) => handleGuardrailsChange(e.target.value)}
                placeholder="Enter guardrails, one per line:&#10;- Never share user data&#10;- Always verify before taking action"
                className="min-h-[80px] text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                One guardrail per line
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={managerOpen} onOpenChange={setManagerOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Manager Agent (Optional)</span>
              {managerOpen ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isManager"
                  checked={formData.isManager}
                  onChange={(e) => onUpdate({ isManager: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isManager" className="cursor-pointer">
                  This agent manages other agents
                </Label>
              </div>
              {formData.isManager && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Manager agents can coordinate with sub-agents.
                  </p>
                  {formData.subAgentIds.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {formData.subAgentIds.length} sub-agent
                      {formData.subAgentIds.length !== 1 ? "s" : ""} selected
                    </p>
                  ) : null}
                  {onOpenSubAgents && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onOpenSubAgents}
                    >
                      {formData.subAgentIds.length > 0
                        ? "Manage Sub-Agents"
                        : "Select Sub-Agents"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
