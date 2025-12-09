"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import type { Connection } from "./agent-modal/store";

interface WorkflowConnectionSelectorProps {
  toolkitSlug: string;
  selectedId: string | undefined;
  connections: Connection[];
  onChange: (connectionId: string) => void;
}

export function WorkflowConnectionSelector({
  toolkitSlug,
  selectedId,
  connections,
  onChange,
}: WorkflowConnectionSelectorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-sm font-medium min-w-[100px]">{toolkitSlug}</span>
      <span className="text-gray-400">→</span>
      {connections.length > 0 ? (
        <Select value={selectedId || ""} onValueChange={onChange}>
          <SelectTrigger className="flex-1 max-w-xs">
            <SelectValue placeholder="Select connection..." />
          </SelectTrigger>
          <SelectContent>
            {connections.map((conn) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.accountLabel || conn.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-muted-foreground">No connections</span>
          <Link
            href="/profile"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Add connection
          </Link>
        </div>
      )}
    </div>
  );
}

