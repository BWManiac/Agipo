"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Thread } from "../types";

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onNewThread,
  onSelectThread,
  onDeleteThread,
}: ThreadSidebarProps) {
  return (
    <div className="w-64 bg-muted/30 border-r border-border flex flex-col shrink-0">
      <div className="p-4 space-y-4">
        {/* New Conversation Button */}
        <Button
          onClick={onNewThread}
          className="w-full flex items-center justify-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Button>

        {/* Recent Conversations */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Recent Conversations
          </h3>
          <ScrollArea className="max-h-[400px]">
            <ul className="space-y-1">
              {threads.length === 0 ? (
                <li className="text-xs text-muted-foreground text-center py-4">
                  No conversations yet
                </li>
              ) : (
                threads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  const isNew = thread.title === "New Conversation";

                  return (
                    <li key={thread.id} className="group relative">
                      <button
                        onClick={() => onSelectThread(thread.id)}
                        className={cn(
                          "w-full flex items-start gap-2 text-xs p-2.5 rounded-lg cursor-pointer transition-colors text-left",
                          isActive
                            ? "bg-primary/10 border border-primary/20"
                            : "bg-background border border-border hover:bg-muted"
                        )}
                      >
                        {isNew ? (
                          <Plus
                            className={cn(
                              "w-3.5 h-3.5 mt-0.5 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        ) : (
                          <MessageSquare
                            className={cn(
                              "w-3.5 h-3.5 mt-0.5 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "font-medium block truncate",
                              isActive
                                ? "text-primary"
                                : "text-foreground",
                              isNew && "italic"
                            )}
                          >
                            {thread.title}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              isActive
                                ? "text-primary/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatRelativeTime(thread.createdAt)}
                          </span>
                        </div>
                      </button>

                      {/* Delete button (hover) */}
                      {!isActive && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteThread(thread.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Delete conversation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

