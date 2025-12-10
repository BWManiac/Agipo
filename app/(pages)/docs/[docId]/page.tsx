"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { DocumentEditor } from "../components/editor";
import { OutlineSidebar } from "../components/outline";
import { ChatSidebar } from "../components/chat";
import { PropertiesPanel } from "../components/properties";
import { HistoryPanel } from "../components/history";
import { ShortcutsDialog } from "../components/shortcuts";
import { ErrorBoundary, LoadingSkeleton } from "../components/common";
import { useDocsStore } from "../store";
import { Button } from "@/components/ui/button";
import {
  List,
  MessageSquare,
  Settings2,
  History,
  Keyboard,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import type { Document } from "@/app/api/docs/services/types";

export default function DocumentPage() {
  const params = useParams();
  const docId = params.docId as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI toggles
  const toggleOutline = useDocsStore((state) => state.toggleOutline);
  const toggleChat = useDocsStore((state) => state.toggleChat);
  const toggleProperties = useDocsStore((state) => state.toggleProperties);
  const toggleHistory = useDocsStore((state) => state.toggleHistory);
  const toggleShortcuts = useDocsStore((state) => state.toggleShortcuts);
  const isOutlineOpen = useDocsStore((state) => state.isOutlineOpen);
  const isChatOpen = useDocsStore((state) => state.isChatOpen);

  useEffect(() => {
    async function fetchDocument() {
      try {
        const response = await fetch(`/api/docs/${docId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("not_found");
          } else {
            setError("Failed to load document");
          }
          return;
        }
        const data = await response.json();
        setDocument(data.document);
      } catch (err) {
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [docId]);

  if (isLoading) {
    return <LoadingSkeleton type="editor" />;
  }

  if (error === "not_found") {
    notFound();
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Document not found"}</p>
          <Link href="/docs">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-full flex">
        {/* Left Sidebar - Outline */}
        {isOutlineOpen && <OutlineSidebar />}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
            <div className="flex items-center gap-2">
              <Link href="/docs">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Docs
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleOutline}
                className={isOutlineOpen ? "bg-muted" : ""}
                title="Toggle outline"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleProperties}
                title="Document properties"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHistory}
                title="Version history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className={isChatOpen ? "bg-muted" : ""}
                title="AI Chat"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShortcuts}
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <DocumentEditor document={document} />
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        {isChatOpen && <ChatSidebar docId={docId} />}

        {/* Panels (Sheets/Dialogs) */}
        <PropertiesPanel docId={docId} />
        <HistoryPanel docId={docId} />
        <ShortcutsDialog />
      </div>
    </ErrorBoundary>
  );
}
