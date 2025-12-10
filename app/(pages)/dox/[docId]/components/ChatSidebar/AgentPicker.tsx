"use client";

import { useState, useEffect } from "react";
import { useDocsStore } from "../../store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface Agent {
  id: string;
  name: string;
  avatar?: string;
}

export function AgentPicker() {
  const store = useDocsStore();
  const { selectedAgentId, setSelectedAgent } = store;

  // Fetch agents (simplified - should use workforce API)
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/workforce");
      if (!res.ok) return [];
      const data = await res.json();
      return data.agents || [];
    },
  });

  return (
    <div className="p-4 border-b">
      <Select
        value={selectedAgentId || undefined}
        onValueChange={(value) => setSelectedAgent(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {agents?.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                {agent.avatar && <span>{agent.avatar}</span>}
                <span>{agent.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
