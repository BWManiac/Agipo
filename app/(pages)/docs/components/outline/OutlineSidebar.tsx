"use client";

import { X, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocsStore } from "../../store";
import { OutlineItem } from "./OutlineItem";
import { OutlineEmpty } from "./OutlineEmpty";

export function OutlineSidebar() {
  const isOutlineOpen = useDocsStore((state) => state.isOutlineOpen);
  const setOutlineOpen = useDocsStore((state) => state.setOutlineOpen);
  const headings = useDocsStore((state) => state.headings);
  const activeHeadingId = useDocsStore((state) => state.activeHeadingId);
  const setActiveHeading = useDocsStore((state) => state.setActiveHeading);

  if (!isOutlineOpen) return null;

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Outline</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOutlineOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Outline content */}
      <ScrollArea className="flex-1">
        {headings.length === 0 ? (
          <OutlineEmpty />
        ) : (
          <div className="p-3">
            {headings.map((heading) => (
              <OutlineItem
                key={heading.id}
                heading={heading}
                isActive={heading.id === activeHeadingId}
                onClick={() => setActiveHeading(heading.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
