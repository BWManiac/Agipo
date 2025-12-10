"use client";

import { useDocsStore } from "../../store";
import { AccessTab } from "./AccessTab";
import { ActivityTab } from "./ActivityTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";

interface SettingsPanelProps {
  docId: string;
}

export function SettingsPanel({ docId }: SettingsPanelProps) {
  const store = useDocsStore();
  const { settingsOpen, closeSettings, loadAccess, loadActivity } = store;

  useEffect(() => {
    if (settingsOpen && docId) {
      loadAccess(docId);
      loadActivity(docId);
    }
  }, [settingsOpen, docId, loadAccess, loadActivity]);

  return (
    <Dialog open={settingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Document Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="access" className="mt-4">
          <TabsList>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="access" className="mt-4">
            <AccessTab docId={docId} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityTab docId={docId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
