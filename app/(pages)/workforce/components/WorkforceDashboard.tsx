"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AgentConfig } from "@/_tables/types";
import { AgentModal } from "./agent-modal";
import { CreateAgentDialog } from "./CreateAgentDialog";

const statusStyles: Record<AgentConfig["status"], string> = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  paused: "bg-slate-100 text-slate-600 border border-slate-200",
  attention: "bg-amber-100 text-amber-700 border border-amber-200",
};

export function WorkforceDashboard() {
  // #region agent log
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkforceDashboard.tsx:23',message:'WorkforceDashboard render',data:{renderCount:renderCountRef.current},sessionId:'debug-session',runId:'run1',hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? null,
    [agents, selectedAgentId]
  );

  const fetchAgents = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkforceDashboard.tsx:36',message:'fetchAgents called',data:{stack:new Error().stack?.split('\n').slice(0,5).join('|')},sessionId:'debug-session',runId:'run1',hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      setIsLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkforceDashboard.tsx:40',message:'About to fetch /api/workforce',data:{},sessionId:'debug-session',runId:'run1',hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const response = await fetch("/api/workforce");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkforceDashboard.tsx:46',message:'fetchAgents completed',data:{agentCount:data.agents?.length||0},sessionId:'debug-session',runId:'run1',hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c625d3a-7743-4a04-bc75-ab472f58bc38',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkforceDashboard.tsx:57',message:'useEffect running - calling fetchAgents',data:{renderCount:renderCountRef.current},sessionId:'debug-session',runId:'post-fix',hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    fetchAgents();
    // Note: fetchAgents is defined inside the component, but with empty deps [] it only runs on mount
    // The frequent calls we saw were due to component remounts (likely HMR), not this effect re-running
  }, []);

  const metrics = [
    {
      label: "Agents hired",
      value: `${agents.length}`,
      helper: "+1 recommendation",
    },
    {
      label: "Tasks completed this week",
      value: "37",
      helper: "5 awaiting review",
    },
    {
      label: "Alerts",
      value: "3",
      helper: "2 require approval",
    },
  ];

  const attentionAgents = agents.filter((agent) => agent.status !== "active");

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-background px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Workforce Hub
            </span>
            <h1 className="text-3xl font-bold tracking-tight">Manage your AI workforce</h1>
            <p className="text-sm text-muted-foreground">
              Review hired agents, monitor outcomes, and collaborate with them just like teammates.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Coverage: Product, Marketing, Support</Badge>
              <Badge variant="secondary">Profile-linked context enabled</Badge>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
              Hire new agent
            </Button>
            <Link href="/profile" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
              View context profile →
            </Link>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/80">
              <CardContent className="space-y-2 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.helper}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Active roster</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Filter
            </Button>
            <Button variant="outline" size="sm">
              Export summary
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No agents yet. Create your first agent to get started.
            </div>
          ) : (
            agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className="flex h-full flex-col rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg focus:outline-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {agent.avatar}
                  </span>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.role}</div>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[agent.status]}`}>
                  {agent.status === "attention"
                    ? "Needs review"
                    : agent.status === "paused"
                      ? "Paused"
                      : "Active"}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{agent.description}</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="font-medium text-foreground">Last activity</div>
                <p className="text-muted-foreground">{agent.lastActivity}</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="font-medium text-foreground">Highlights</div>
                <p className="text-muted-foreground">{agent.highlight}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {agent.capabilities.map((capability) => (
                  <Badge key={capability} variant="outline">
                    {capability}
                  </Badge>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {agent.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-border px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {metric.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">{metric.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm font-semibold text-primary">Open agent →</div>
            </button>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Attention needed</h2>
          <Button variant="link" className="text-sm font-semibold">
            View escalation log
          </Button>
        </div>
        <ScrollArea className="h-48 rounded-2xl border border-border bg-background">
          <div className="divide-y divide-border">
            {attentionAgents.map((agent) => (
              <div key={`${agent.id}-attention`} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold text-foreground">
                    {agent.name} <span className="text-muted-foreground">· {agent.role}</span>
                  </div>
                  <div className="text-muted-foreground">{agent.highlight}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedAgentId(agent.id)}>
                  Review
                </Button>
              </div>
            ))}
            {attentionAgents.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                All agents are running smoothly.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </section>

      <AgentModal
        agent={selectedAgent}
        open={selectedAgent !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAgentId(null);
        }}
        onAgentUpdated={fetchAgents}
      />

      <CreateAgentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAgentCreated={() => {
          fetchAgents();
        }}
      />
    </div>
  );
}
