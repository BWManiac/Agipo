"use client";

import { useDocsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Agent {
  id: string;
  name: string;
  avatar?: string;
}

export function AccessTab({ docId }: { docId: string }) {
  const store = useDocsStore();
  const { agentAccess, grantAccess, revokeAccess } = store;
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<"read" | "read-write">("read");

  // Fetch available agents
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/workforce");
      if (!res.ok) return [];
      const data = await res.json();
      return data.agents || [];
    },
  });

  const handleGrant = async () => {
    if (!selectedAgentId) return;
    await grantAccess(docId, selectedAgentId, selectedPermission);
    setSelectedAgentId("");
  };

  const handleRevoke = async (agentId: string) => {
    if (confirm("Revoke access for this agent?")) {
      await revokeAccess(docId, agentId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents?.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={selectedPermission}
          onValueChange={(v) => setSelectedPermission(v as "read" | "read-write")}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="read-write">Read/Write</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleGrant} disabled={!selectedAgentId}>
          <Plus className="w-4 h-4 mr-2" />
          Grant
        </Button>
      </div>

      <div className="space-y-2">
        {agentAccess.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents have access</p>
        ) : (
          agentAccess.map((access) => (
            <div
              key={access.agentId}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <div className="font-medium text-sm">{access.agentName}</div>
                <div className="text-xs text-muted-foreground">
                  {access.permission} • {new Date(access.grantedAt).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRevoke(access.agentId)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
