"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentConfig } from "@/_tables/types";
import { getAvailableModels, type ModelInfo } from "@/app/api/workforce/[agentId]/chat/services/models";

interface ConfigTabProps {
  agent: AgentConfig;
}

export function ConfigTab({ agent }: ConfigTabProps) {
  const [objectives, setObjectives] = useState(agent.objectives.join("\n"));
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [model, setModel] = useState(agent.model);

  // Get available models directly (no API call needed)
  const models = getAvailableModels();

  const handleSave = () => {
    console.log("Saving config:", {
      objectives: objectives.split("\n"),
      systemPrompt,
      model,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <h2 className="text-lg font-semibold">Agent Configuration</h2>

        {/* Objectives */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Objectives</Label>
            <p className="text-xs text-gray-500 mb-2">What is this agent trying to achieve?</p>
            <Textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              className="min-h-[100px] text-sm"
              placeholder="- Increase user retention&#10;- Reduce support ticket volume"
            />
          </div>
        </div>

        {/* Variables */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Variables & Preferences</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1">Tone</Label>
              <Select defaultValue="professional">
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-500 mb-1">Output Length</Label>
              <Select defaultValue="concise">
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Core Settings */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[150px] text-sm font-mono"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {model && (
              <p className="mt-1 text-xs text-gray-500">
                {models.find((m) => m.id === model)?.description || ""}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="bg-black text-white hover:bg-gray-800">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

