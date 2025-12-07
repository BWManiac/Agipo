"use client";

import Link from "next/link";
import { useWorkflows, useCreateWorkflow } from "./hooks/useWorkflows";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { PLATFORM_ICONS } from "@/_tables/workflows-b/types";

export default function WorkflowsBPage() {
  const { data: workflows, isLoading } = useWorkflows();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows B</h1>
          <p className="text-muted-foreground mt-1">
            Compose multi-step automations from connected tools.
          </p>
        </div>
        <CreateWorkflowDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[200px]">
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workflows?.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows?.map((workflow) => (
            <Link key={workflow.id} href={`/workflows-b/${workflow.id}`} className="block h-full">
              <Card className="h-full hover:border-primary/50 transition-all cursor-pointer flex flex-col hover:shadow-md group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-secondary/50 text-primary rounded-lg border border-border/50 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <GitBranch className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={workflow.status} />
                      {workflow.lastModified && (
                        <Badge variant="secondary" className="font-normal text-xs">
                          {formatDistanceToNow(new Date(workflow.lastModified), { addSuffix: true })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {workflow.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workflow.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4 text-sm text-muted-foreground flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>{workflow.stepCount} {workflow.stepCount === 1 ? "Step" : "Steps"}</span>
                  </div>
                  {workflow.platforms.length > 0 && (
                    <div className="flex items-center gap-1">
                      {workflow.platforms.slice(0, 3).map((platform) => (
                        <span key={platform} className="text-base" title={platform}>
                          {PLATFORM_ICONS[platform] || "🔧"}
                        </span>
                      ))}
                      {workflow.platforms.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{workflow.platforms.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
          
          <CreateWorkflowDialog trigger={
            <button className="h-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:bg-accent/50 hover:text-accent-foreground transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Create New Workflow</span>
            </button>
          } />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
    draft: { variant: "secondary", label: "Draft" },
    ready: { variant: "outline", label: "Ready" },
    published: { variant: "default", label: "Published" },
  };
  const config = variants[status] || variants.draft;
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <GitBranch className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No workflows yet</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Create your first workflow to automate multi-step processes using your connected tools.
      </p>
      <CreateWorkflowDialog />
    </div>
  );
}

function CreateWorkflowDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createWorkflow = useCreateWorkflow();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkflow.mutateAsync({ name, description: description || undefined });
    setOpen(false);
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input 
              placeholder="e.g. Job Application Helper" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="What does this workflow do?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkflow.isPending}>
              {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}




