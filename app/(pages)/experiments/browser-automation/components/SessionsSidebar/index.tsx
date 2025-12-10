"use client";

import { useBrowserStore } from "../../store";
import { SessionCard } from "./SessionCard";
import { NewSessionButton } from "./NewSessionButton";
import { NewSessionDialog } from "./NewSessionDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SessionsSidebar() {
  const sessions = useBrowserStore((state) => state.sessions);
  const isLoading = useBrowserStore((state) => state.isLoading);
  const sidebarCollapsed = useBrowserStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useBrowserStore((state) => state.toggleSidebar);

  return (
    <>
      <aside
        className={cn(
          "bg-white border-r flex flex-col transition-all duration-200",
          sidebarCollapsed ? "w-12" : "w-64"
        )}
      >
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-3 shrink-0">
          {!sidebarCollapsed && (
            <span className="font-medium text-sm">Sessions</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        {!sidebarCollapsed && (
          <>
            {/* New Session Button */}
            <div className="p-3 border-b">
              <NewSessionButton />
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>No active sessions</p>
                  <p className="mt-1 text-xs">
                    Create a session to get started
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-xs text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </aside>

      <NewSessionDialog />
    </>
  );
}
