"use client";

import { useState } from "react";
import { useRecordsStore } from "../../store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessTabProps {
  tableId: string;
}

export function AccessTab({ tableId }: AccessTabProps) {
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  const {
    accessList,
    isLoadingAccess,
    agents,
    grantAccess,
    revokeAccess,
    updatePermission,
  } = useRecordsStore();

  // Agents not yet in access list
  const availableAgents = agents.filter(
    (a) => !accessList.find((access) => access.id === a.id)
  );

  const handleGrantAccess = async (agentId: string) => {
    await grantAccess(tableId, agentId, "read_write");
    setAddAgentOpen(false);
  };

  const handlePermissionChange = async (agentId: string, value: string) => {
    if (value === "remove") {
      await revokeAccess(tableId, agentId);
    } else {
      await updatePermission(tableId, agentId, value as "read" | "read_write");
    }
  };

  return (
    <div className="space-y-6">
      {/* Owner Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Who has access</h3>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Owner
          </div>
          <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">You</div>
              <div className="text-xs text-muted-foreground">Full access</div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Section */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          Agents ({accessList.length})
        </div>

        {isLoadingAccess ? (
          <div className="text-sm text-muted-foreground py-4">Loading...</div>
        ) : (
          <>
            {accessList.map((access) => (
              <div
                key={access.id}
                className="flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-md bg-secondary border flex items-center justify-center text-base">
                  {access.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{access.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {access.role}
                  </div>
                </div>
                <Select
                  value={access.permission}
                  onValueChange={(v) => handlePermissionChange(access.id, v)}
                >
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read_write">Read & Write</SelectItem>
                    <SelectItem value="read">Read only</SelectItem>
                    <SelectItem value="remove" className="text-red-600">
                      Remove
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}

            {/* Add Agent Button */}
            <Popover open={addAgentOpen} onOpenChange={setAddAgentOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Add agent access
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                {availableAgents.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    All agents already have access
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleGrantAccess(agent.id)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-secondary rounded-md transition-colors"
                      >
                        <span className="w-6 h-6 rounded-md bg-secondary border flex items-center justify-center text-sm">
                          {agent.avatar}
                        </span>
                        <div className="text-left">
                          <div className="text-sm font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.role}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  );
}
