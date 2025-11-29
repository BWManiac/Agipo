import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AgentHeaderProps } from "../types/header";

export function AgentHeader({ agent }: AgentHeaderProps) {
  return (
    <DialogHeader className="px-8 pt-8">
      <DialogTitle className="flex items-center gap-4 text-2xl">
        <span className="text-3xl leading-none">{agent.avatar}</span>
        <span>
          {agent.name}
          <span className="block text-base font-normal text-muted-foreground">{agent.role}</span>
        </span>
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">{agent.description}</DialogDescription>
    </DialogHeader>
  );
}

