"use client";

import Link from "next/link";
import { useTables, useCreateTable } from "./hooks/useRecords";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Database, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function RecordsPage() {
  const { data: tables, isLoading } = useTables();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Records Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Manage the structured data your agents use to operate.
          </p>
        </div>
        <CreateTableDialog />
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables?.map((table) => (
            <Link key={table.id} href={`/records/${table.id}`} className="block h-full">
              <Card className="h-full hover:border-primary/50 transition-all cursor-pointer flex flex-col hover:shadow-md group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-secondary/50 text-primary rounded-lg border border-border/50 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <Database className="w-5 h-5" />
                    </div>
                    {table.lastModified && (
                        <Badge variant="secondary" className="font-normal text-xs">
                            {formatDistanceToNow(new Date(table.lastModified), { addSuffix: true })}
                        </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {table.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {table.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="border-t pt-4 text-sm text-muted-foreground flex justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{table.recordCount} Records</span>
                    </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
          
          <CreateTableDialog trigger={
            <button className="h-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:bg-accent/50 hover:text-accent-foreground transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Create New Table</span>
            </button>
          } />
        </div>
      )}
    </div>
  );
}

function CreateTableDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const createTable = useCreateTable();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTable.mutateAsync({ name, description: desc });
    setOpen(false);
    setName("");
    setDesc("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Table
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Table Name</Label>
            <Input 
              placeholder="e.g. Marketing Campaigns" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              placeholder="What is this data used for?" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTable.isPending}>
              {createTable.isPending ? "Creating..." : "Create Table"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
