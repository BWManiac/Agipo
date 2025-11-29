"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { WorkflowCard } from "./components/WorkflowCard";
import type { WorkflowSummary } from "@/_tables/types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const response = await fetch("/api/tools/list");
        if (!response.ok) {
          throw new Error("Failed to fetch workflows");
        }
        const data = await response.json();
        setWorkflows(data);
      } catch (error) {
        console.error(error);
        // TODO: surface error to UI (toast/snackbar)
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <Button asChild size="lg">
          <Link href="/tools/editor">+ New Workflow</Link>
        </Button>
      </div>

      {isLoading ? (
        <p>Loading workflows...</p>
      ) : workflows.length === 0 ? (
        <p>No workflows yet. Create your first workflow to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workflows.map((wf) => (
            <WorkflowCard key={wf.id} workflow={wf} />
          ))}
        </div>
      )}
    </div>
  );
}
