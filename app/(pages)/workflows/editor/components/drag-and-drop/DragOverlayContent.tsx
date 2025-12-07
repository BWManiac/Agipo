"use client";

interface DragOverlayContentProps {
  data: Record<string, unknown>;
}

export function DragOverlayContent({ data }: DragOverlayContentProps) {
  const name = (data.name as string) || (data.tool as { name?: string })?.name || "Item";
  const type = data.type as string;

  return (
    <div className="px-4 py-2 bg-card border-2 border-primary rounded-lg shadow-lg opacity-90">
      <div className="text-sm font-medium text-foreground">{name}</div>
      <div className="text-xs text-muted-foreground capitalize">{type}</div>
    </div>
  );
}

