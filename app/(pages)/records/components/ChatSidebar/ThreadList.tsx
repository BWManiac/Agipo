"use client";

import { useRecordsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ThreadListProps {
  tableId: string;
}

export function ThreadList({ tableId }: ThreadListProps) {
  const {
    threads,
    activeThreadId,
    selectThread,
    createThread,
    deleteThread,
    isLoadingThreads,
    loadThreadMessages,
    clearMessages,
  } = useRecordsStore();

  const handleNewThread = async () => {
    const thread = await createThread(tableId);
    if (thread) {
      clearMessages();
    }
  };

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
    loadThreadMessages(tableId, threadId);
  };

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    await deleteThread(tableId, threadId);
  };

  return (
    <div className="border-b">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Conversations
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={handleNewThread}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Thread List */}
      <div className="max-h-48 overflow-y-auto">
        {isLoadingThreads ? (
          <div className="px-4 py-3 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : threads.length === 0 ? (
          <button
            onClick={handleNewThread}
            className="w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Start a conversation
          </button>
        ) : (
          threads.slice(0, 5).map((thread) => (
            <div
              key={thread.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectThread(thread.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectThread(thread.id);
                }
              }}
              className={cn(
                "w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-muted/50 group transition-colors cursor-pointer",
                activeThreadId === thread.id && "bg-muted"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{thread.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDeleteThread(e, thread.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
