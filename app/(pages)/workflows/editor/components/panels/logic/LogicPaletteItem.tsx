"use client";

import { DraggablePaletteItem } from "../../drag-and-drop/DraggablePaletteItem";
import { GitBranch, Layers, RefreshCw, List, Clock, UserCheck } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  branch: GitBranch,
  parallel: Layers,
  loop: RefreshCw,
  foreach: List,
  wait: Clock,
  suspend: UserCheck,
};

const colorMap: Record<string, string> = {
  purple: "bg-purple-500/10 text-purple-500",
  cyan: "bg-cyan-500/10 text-cyan-500",
  green: "bg-green-500/10 text-green-500",
  pink: "bg-pink-500/10 text-pink-500",
  yellow: "bg-yellow-500/10 text-yellow-500",
  red: "bg-red-500/10 text-red-500",
};

interface LogicPaletteItemProps {
  type: string;
  name: string;
  description: string;
  color: string;
}

export function LogicPaletteItem({ type, name, description, color }: LogicPaletteItemProps) {
  const Icon = iconMap[type] || GitBranch;
  const colorClass = colorMap[color] || colorMap.purple;

  return (
    <DraggablePaletteItem
      id={`palette-control-${type}`}
      data={{ type: "control", controlType: type, name }}
    >
      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
        <div className={`w-8 h-8 rounded-md ${colorClass} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </DraggablePaletteItem>
  );
}

