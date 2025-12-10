"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateFromScratchWizard } from "./CreateFromScratchWizard";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentCreated?: () => void;
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onAgentCreated,
}: CreateAgentDialogProps) {
  const [activeTab, setActiveTab] = useState("create-custom");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hire new agent</DialogTitle>
          <DialogDescription>
            Create a custom agent or hire from the marketplace
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="create-custom">Create Custom</TabsTrigger>
            <TabsTrigger value="hire-marketplace">Hire from Marketplace</TabsTrigger>
          </TabsList>
          <TabsContent value="create-custom" className="mt-4">
            <CreateFromScratchWizard
              onComplete={() => {
                onAgentCreated?.();
                onOpenChange(false);
              }}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="hire-marketplace" className="mt-4">
            <div className="py-8 text-center text-muted-foreground">
              Marketplace coming soon
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
