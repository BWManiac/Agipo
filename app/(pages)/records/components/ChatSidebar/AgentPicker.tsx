"use client";

import { useState } from "react";
import { useRecordsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function AgentPicker() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    agents,
    selectedAgentId,
    selectAgent,
    isLoadingAgents,
    getSelectedAgent,
  } = useRecordsStore();

  const selectedAgent = getSelectedAgent();

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (agentId: string) => {
    selectAgent(agentId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="p-4 border-b">
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Chat with Agent
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10"
            disabled={isLoadingAgents}
          >
            {selectedAgent ? (
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-secondary border flex items-center justify-center text-sm">
                  {selectedAgent.avatar}
                </span>
                <div className="text-left">
                  <div className="text-sm font-medium">{selectedAgent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAgent.role}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select an agent...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
              />
            </div>
          </div>

          {/* Agent List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredAgents.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No agents found
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition-colors",
                    selectedAgentId === agent.id && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  <span className="w-8 h-8 rounded-md bg-secondary border flex items-center justify-center text-lg shrink-0">
                    {agent.avatar}
                  </span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                  {selectedAgentId === agent.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create New Agent Link */}
          <div className="p-2 border-t bg-muted/50">
            <Link
              href="/workforce"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Create new agent
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
