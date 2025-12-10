"use client";

import { useEffect } from "react";
import { useRecordsStore } from "../../store";
import { AccessTab } from "./AccessTab";
import { ActivityTab } from "./ActivityTab";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  tableId: string;
}

export function SettingsPanel({ tableId }: SettingsPanelProps) {
  const {
    settingsPanelOpen,
    settingsPanelTab,
    setSettingsPanelTab,
    closeSettingsPanel,
    fetchAccess,
    fetchActivity,
  } = useRecordsStore();

  // Load data when panel opens
  useEffect(() => {
    if (settingsPanelOpen) {
      fetchAccess(tableId);
      fetchActivity(tableId);
    }
  }, [settingsPanelOpen, tableId, fetchAccess, fetchActivity]);

  if (!settingsPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeSettingsPanel}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <h2 className="font-semibold">Table Settings</h2>
          <Button variant="ghost" size="icon" onClick={closeSettingsPanel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setSettingsPanelTab("access")}
              className={cn(
                "px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                settingsPanelTab === "access"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Access
            </button>
            <button
              onClick={() => setSettingsPanelTab("activity")}
              className={cn(
                "px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                settingsPanelTab === "activity"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {settingsPanelTab === "access" && <AccessTab tableId={tableId} />}
          {settingsPanelTab === "activity" && <ActivityTab />}
        </div>
      </div>
    </>
  );
}
