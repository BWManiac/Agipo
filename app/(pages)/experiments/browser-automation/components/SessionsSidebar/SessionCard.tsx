"use client";

import { useBrowserStore, type BrowserSession } from "../../store";
import { Button } from "@/components/ui/button";
import { X, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionCardProps {
  session: BrowserSession;
}

const STATUS_COLORS: Record<BrowserSession["status"], string> = {
  starting: "bg-yellow-500",
  running: "bg-green-500",
  idle: "bg-blue-500",
  stopped: "bg-gray-500",
  error: "bg-red-500",
};

const STATUS_LABELS: Record<BrowserSession["status"], string> = {
  starting: "Starting...",
  running: "Running",
  idle: "Idle",
  stopped: "Stopped",
  error: "Error",
};

export function SessionCard({ session }: SessionCardProps) {
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const selectSession = useBrowserStore((state) => state.selectSession);
  const terminateSession = useBrowserStore((state) => state.terminateSession);

  const isActive = activeSessionId === session.id;
  const isStarting = session.status === "starting";

  const handleSelect = () => {
    if (!isStarting) {
      selectSession(session.id);
    }
  };

  const handleTerminate = async () => {
    await terminateSession(session.id);
  };

  // Format session ID for display
  const shortId = session.id.slice(0, 8);

  // Format time
  const createdTime = new Date(session.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border cursor-pointer transition-all",
        isActive
          ? "bg-primary/5 border-primary"
          : "bg-white hover:bg-gray-50 border-transparent",
        isStarting && "cursor-wait opacity-70"
      )}
      onClick={handleSelect}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="shrink-0 mt-0.5">
          {isStarting ? (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
          ) : (
            <Globe className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {session.profileName || `Session ${shortId}`}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                STATUS_COLORS[session.status]
              )}
            />
            <span>{STATUS_LABELS[session.status]}</span>
            <span>|</span>
            <span>{createdTime}</span>
          </div>

          {session.actionCount > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {session.actionCount} action{session.actionCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Terminate Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-red-100 hover:text-red-600"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>End this session?</AlertDialogTitle>
              <AlertDialogDescription>
                This will terminate the browser session. Any unsaved work in the
                browser will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTerminate}
                className="bg-red-600 hover:bg-red-700"
              >
                End Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
