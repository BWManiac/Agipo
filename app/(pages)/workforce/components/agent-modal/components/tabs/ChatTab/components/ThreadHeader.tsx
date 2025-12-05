"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Pencil, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Thread } from "../types";

interface ThreadHeaderProps {
  thread: Thread | null;
  onRename: (threadId: string, newTitle: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function ThreadHeader({ thread, onRename }: ThreadHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isNewConversation = !thread || thread.title === "New Conversation";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!thread) return;
    setEditValue(thread.title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!thread || !editValue.trim()) return;
    onRename(thread.id, editValue.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-muted/30">
      <div className="flex items-center gap-2">
        {isNewConversation ? (
          <Plus className="w-4 h-4 text-muted-foreground" />
        ) : (
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
        )}

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm w-64"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleSave}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCancel}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <h3
              className={cn(
                "text-sm font-medium",
                isNewConversation
                  ? "text-muted-foreground italic"
                  : "text-foreground"
              )}
            >
              {thread?.title ?? "New Conversation"}
            </h3>
            {thread && (
              <span className="text-xs text-muted-foreground">
                • Started {formatRelativeTime(thread.createdAt)}
              </span>
            )}
            {isNewConversation && (
              <span className="text-xs text-muted-foreground">
                • Title will be set from first message
              </span>
            )}
          </>
        )}
      </div>

      {!isNewConversation && !isEditing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Rename
        </Button>
      )}
    </div>
  );
}

