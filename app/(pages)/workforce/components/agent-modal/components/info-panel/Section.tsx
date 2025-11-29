import { Badge } from "@/components/ui/badge";
import type { SectionProps } from "../../types/info-panel/items";

export function Section({ heading, items }: SectionProps) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {heading}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="border border-border">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

