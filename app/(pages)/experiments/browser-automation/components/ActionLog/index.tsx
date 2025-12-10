"use client";

import { useBrowserStore } from "../../store";
import { ActionEntry } from "./ActionEntry";
import { ActionFilters } from "./ActionFilters";
import { ActionEmpty } from "./ActionEmpty";

export function ActionLog() {
  const actions = useBrowserStore((state) => state.actions);
  const actionFilter = useBrowserStore((state) => state.actionFilter);
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const clearActions = useBrowserStore((state) => state.clearActions);

  // Filter actions for current session
  const sessionActions = actions.filter(
    (a) => !activeSessionId || a.sessionId === activeSessionId
  );

  // Apply type filter
  const filteredActions =
    actionFilter === "all"
      ? sessionActions
      : sessionActions.filter((a) => a.type === actionFilter);

  // Count by type for filter badges
  const typeCounts = sessionActions.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (sessionActions.length === 0) {
    return <ActionEmpty />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b shrink-0">
        <ActionFilters typeCounts={typeCounts} />
      </div>

      {/* Actions List */}
      <div className="flex-1 overflow-y-auto">
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No {actionFilter} actions yet
          </div>
        ) : (
          <div className="divide-y">
            {filteredActions.map((action) => (
              <ActionEntry key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredActions.length} action{filteredActions.length !== 1 ? "s" : ""}
            {actionFilter !== "all" && ` (${actionFilter})`}
          </span>
          <button
            onClick={clearActions}
            className="hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
