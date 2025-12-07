"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, GitBranch, Clock, ArrowRight, Trash2, Sparkles, Layers } from "lucide-react";
import { WorkflowSummary } from "@/app/api/workflows-d/services/types";

export default function WorkflowsDListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      const response = await fetch("/api/workflows-d/list");
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
      const response = await fetch("/api/workflows-d/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Workflow" }),
      });

      if (response.ok) {
        const workflow = await response.json();
        router.push(`/workflows-d/editor?id=${workflow.id}`);
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
      const response = await fetch(`/api/workflows-d/${id}`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Workflows D</h1>
                <p className="text-sm text-slate-400">AI-powered workflow orchestration</p>
              </div>
            </div>
            <button
              onClick={createWorkflow}
              disabled={isCreating}
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creating..." : "New Workflow"}
              <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative max-w-7xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="h-12 w-12 border-2 border-violet-500/30 rounded-full" />
              <div className="absolute inset-0 h-12 w-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-slate-400 text-sm">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-violet-500/20 rounded-3xl blur-xl" />
              <div className="relative inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-slate-800/50 border border-white/5 mb-6">
                <GitBranch className="h-10 w-10 text-violet-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No workflows yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Create your first workflow and start building powerful automations with AI assistance.
            </p>
            <button
              onClick={createWorkflow}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25"
            >
              <Sparkles className="h-4 w-4" />
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => router.push(`/workflows-d/editor?id=${workflow.id}`)}
                className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 cursor-pointer transition-all duration-300"
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/5 group-hover:to-fuchsia-500/5 rounded-2xl transition-all duration-300" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
                      <GitBranch className="h-5 w-5 text-violet-400" />
                    </div>
                    <button
                      onClick={(e) => deleteWorkflow(workflow.id, e)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors line-clamp-1">
                    {workflow.name}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                    {workflow.description || "No description"}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Layers className="h-3.5 w-3.5" />
                        {workflow.stepCount} {workflow.stepCount === 1 ? "step" : "steps"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(workflow.lastModified)}
                      </span>
                    </div>
                    {workflow.published ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                        Published
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
                        Draft
                      </span>
                    )}
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




