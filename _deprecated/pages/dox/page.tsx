"use client";

import Link from "next/link";
import { useDocuments, useCreateDocument } from "./hooks/useDocuments";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DoxCatalogPage() {
  const { data: documents, isLoading } = useDocuments();
  const router = useRouter();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your documents with AI assistance.
          </p>
        </div>
        <CreateDocumentDialog />
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
          {documents && documents.length > 0 ? (
            documents.map((doc) => (
              <Link key={doc.id} href={`/dox/${doc.id}`} className="block h-full">
                <Card className="h-full hover:border-primary/50 transition-all cursor-pointer flex flex-col hover:shadow-md group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-secondary/50 text-primary rounded-lg border border-border/50 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {doc.excerpt || "No content yet."}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first document to get started.
              </p>
              <CreateDocumentDialog />
            </div>
          )}

          <CreateDocumentDialog trigger={
            <button className="h-full min-h-[200px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:bg-accent/50 hover:text-accent-foreground transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">Create New Document</span>
            </button>
          } />
        </div>
      )}
    </div>
  );
}

function CreateDocumentDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createDocument = useCreateDocument();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doc = await createDocument.mutateAsync({ title: title || undefined });
      setOpen(false);
      setTitle("");
      router.push(`/dox/${doc.id}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Document Title</Label>
            <Input 
              placeholder="e.g. Project Notes" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDocument.isPending}>
              {createDocument.isPending ? "Creating..." : "Create Document"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
