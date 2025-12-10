"use client";

import { useParams } from "next/navigation";
import { useDocument } from "./hooks/useDocument";
import { useDocsStore } from "./store";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DocumentHeader } from "./components/DocumentHeader";
import { DocumentEditor } from "./components/DocumentEditor";
import { DocumentOutline } from "./components/DocumentOutline";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { ChatSidebar } from "./components/ChatSidebar";
import { AgentEditingIndicator } from "./components/ChatSidebar/AgentEditingIndicator";
import { SettingsPanel } from "./components/SettingsPanel";
import { VersionHistory } from "./components/VersionHistory";
import { VersionPreview } from "./components/VersionHistory/VersionPreview";
import { VersionCompare } from "./components/VersionHistory/VersionCompare";
import { Settings } from "lucide-react";

export default function DocumentPage() {
  const params = useParams();
  const docId = params.docId as string;
  const { data: document, isLoading, error } = useDocument(docId);
  const store = useDocsStore();

  // Update store when document loads
  useEffect(() => {
    if (document) {
      store.setDocument({
        id: document.id,
        title: document.title,
        content: document.content,
        properties: document.properties,
      });
      if (document.outline) {
        store.setHeadings(document.outline);
      }
      store.setProperties(document.properties);
    }
  }, [document, store]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount, not when store changes

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load document"}
          </p>
          <Link href="/dox">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/dox">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <DocumentHeader />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => store.openSettings()}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <DocumentOutline />
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            <DocumentEditor initialMarkdown={document.content} />
          </div>
        </div>
        <PropertiesPanel />
        <ChatSidebar docId={docId} />
        {store.versionPanelOpen && <VersionHistory />}
      </div>
      <AgentEditingIndicator />
      <SettingsPanel docId={docId} />
      {store.selectedVersionId && <VersionPreview />}
      {store.compareMode && <VersionCompare />}
    </div>
  );
}
