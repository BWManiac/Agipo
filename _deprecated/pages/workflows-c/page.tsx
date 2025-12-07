"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, GitBranch, Clock, ChevronRight, Trash2 } from "lucide-react";
import { WorkflowSummary } from "@/app/api/workflows/services/types";

export default function WorkflowsCListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const response = await fetch("/api/workflows-c/list");
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createWorkflow() {
    setIsCreating(true);
    try {
      const response = await fetch("/api/workflows-c/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Workflow" }),
      });

      if (response.ok) {
        const workflow = await response.json();
        router.push(`/workflows-c/editor?id=${workflow.id}`);
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteWorkflow(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      const response = await fetch(`/api/workflows-c/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Workflows C</h1>
                <p className="text-sm text-slate-400">Blueprint-style workflow editor</p>
              </div>
            </div>
            <button
              onClick={createWorkflow}
              disabled={isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating..." : "New Workflow"}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800 mb-4">
              <GitBranch className="h-8 w-8 text-slate-500" />
            </div>
            <h2 className="text-lg font-medium text-slate-300 mb-2">No workflows yet</h2>
            <p className="text-slate-500 mb-6">Create your first workflow to get started</p>
            <button
              onClick={createWorkflow}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => router.push(`/workflows-c/editor?id=${workflow.id}`)}
                className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
                      <GitBranch className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                        {workflow.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-400">
                          {workflow.stepCount} {workflow.stepCount === 1 ? "step" : "steps"}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(workflow.lastModified)}
                        </span>
                        {workflow.published ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => deleteWorkflow(workflow.id, e)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}




