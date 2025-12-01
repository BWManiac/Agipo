import { Button } from "@/components/ui/button";
import type { ToolUsageListProps } from "../../types/info-panel/items";

export function ToolUsageList({ tools, isLoading, error, onSelect, onEdit }: ToolUsageListProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Tool usage
        </h3>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit tools
        </Button>
      </div>
      {isLoading ? (
        <div className="rounded-xl border border-border bg-background p-6 text-center text-sm text-muted-foreground">
          Loading tools...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load tools</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : tools.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">No tools assigned</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &quot;Edit tools&quot; to assign tools to this agent.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tools.map((tool) => (
            <div key={tool.id} className="rounded-xl border border-border bg-background p-4">
              <button
                className="flex w-full items-start justify-between gap-4 text-left"
                onClick={() => onSelect(tool.id)}
              >
                <div>
                  <h4 className="font-semibold text-foreground underline-offset-4 hover:underline">
                    {tool.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>—</div>
                  <div>—</div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

