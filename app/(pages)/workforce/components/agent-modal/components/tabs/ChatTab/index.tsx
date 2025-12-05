"use client";

import { useState, useCallback } from "react";
import type { AgentConfig } from "@/_tables/types";
import { ThreadSidebar } from "./components/ThreadSidebar";
import { ThreadHeader } from "./components/ThreadHeader";
import { ChatArea } from "./components/ChatArea";
import { DeleteThreadDialog } from "./components/DeleteThreadDialog";
import { useThreads } from "./hooks/useThreads";
import { useChatMemory } from "./hooks/useChatMemory";
import type { Thread } from "./types";

interface ChatTabProps {
  agent: AgentConfig;
}

export function ChatTab({ agent }: ChatTabProps) {
  // Thread management state
  const {
    threads,
    activeThread,
    activeThreadId,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    updateThreadTitle,
  } = useThreads(agent.id);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);

  // Chat state with memory integration
  const { messages, sendMessage, isStreaming, isLoadingMessages } = useChatMemory({
    agentId: agent.id,
    agentName: agent.name,
    threadId: activeThreadId,
    defaultPrompt: agent.highlight,
    onFirstMessage: useCallback(
      (preview: string) => {
        if (activeThreadId) {
          updateThreadTitle(activeThreadId, preview);
        }
      },
      [activeThreadId, updateThreadTitle]
    ),
  });

  // Handle new conversation
  const handleNewThread = useCallback(() => {
    createThread();
  }, [createThread]);

  // Handle thread selection
  const handleSelectThread = useCallback(
    (threadId: string) => {
      selectThread(threadId);
    },
    [selectThread]
  );

  // Handle delete initiation (show dialog)
  const handleDeleteClick = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (thread) {
        setThreadToDelete(thread);
        setDeleteDialogOpen(true);
      }
    },
    [threads]
  );

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (threadToDelete) {
      deleteThread(threadToDelete.id);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  }, [threadToDelete, deleteThread]);

  // Handle rename
  const handleRename = useCallback(
    (threadId: string, newTitle: string) => {
      renameThread(threadId, newTitle);
    },
    [renameThread]
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Thread Sidebar */}
      <ThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onNewThread={handleNewThread}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteClick}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
        {/* Thread Header */}
        <ThreadHeader thread={activeThread} onRename={handleRename} />

        {/* Chat Area */}
        <ChatArea
          agentName={agent.name}
          agentEmoji={agent.avatar}
          messages={messages}
          isStreaming={isStreaming}
          isLoadingMessages={isLoadingMessages}
          defaultPrompt={activeThread ? "" : agent.highlight}
          onSendMessage={sendMessage}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteThreadDialog
        open={deleteDialogOpen}
        threadTitle={threadToDelete?.title ?? ""}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

