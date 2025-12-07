"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GitBranch, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Clock,
  Layers
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkflowSummary } from "@/app/api/workflows-e/services/types";

export default function WorkflowsEPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const response = await fetch("/api/workflows-e/list");
      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateWorkflow() {
    try {
      const response = await fetch("/api/workflows-e/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Untitled Workflow",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const workflow = await response.json();
      router.push(`/workflows-e/editor?id=${workflow.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
    }
  }

  async function handleDeleteWorkflow(id: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows-e/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      // Refresh the list
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows E</h1>
          <p className="text-muted-foreground mt-1">
            Compose multi-step automations from Composio tools (Variation E)
          </p>
        </div>
        <Button onClick={handleCreateWorkflow} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-slate-100 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <GitBranch className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No workflows yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create your first workflow to start automating multi-step processes 
              with Composio tools.
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className="group hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/workflows-e/editor?id=${workflow.id}`}>
                      <CardTitle className="text-lg truncate hover:text-primary transition-colors">
                        {workflow.name}
                      </CardTitle>
                    </Link>
                    <CardDescription className="mt-1 line-clamp-2">
                      {workflow.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/workflows-e/editor?id=${workflow.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    <span>{workflow.stepCount} steps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(workflow.lastModified)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


