"use client";

import { useDocsStore } from "../../store";
import { OutlineItem } from "./OutlineItem";
import { OutlineEmpty } from "./OutlineEmpty";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DocumentOutline() {
  const store = useDocsStore();
  const { headings, outlineCollapsed, activeHeadingId, expandedSections, toggleOutline, toggleSection } = store;

  if (outlineCollapsed) {
    return (
      <div className="w-12 border-r flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleOutline}
          className="rotate-90"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Outline</h2>
        <Button variant="ghost" size="icon" onClick={toggleOutline}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {headings.length === 0 ? (
          <OutlineEmpty />
        ) : (
          <div className="p-2">
            {headings.map((heading, index) => {
              const isExpanded = expandedSections.has(heading.id);
              const hasChildren = index < headings.length - 1 && 
                headings[index + 1].level > heading.level;

              return (
                <div key={heading.id} className="mb-1">
                  <div className="flex items-center gap-1">
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleSection(heading.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                    {!hasChildren && <div className="w-6" />}
                    <OutlineItem
                      heading={heading}
                      isActive={activeHeadingId === heading.id}
                      onClick={() => store.setActiveHeading(heading.id)}
                    />
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="ml-6 mt-1">
                      {/* Render child headings */}
                      {headings
                        .slice(index + 1)
                        .filter((h) => h.level > heading.level && h.level <= heading.level + 1)
                        .map((child) => (
                          <OutlineItem
                            key={child.id}
                            heading={child}
                            isActive={activeHeadingId === child.id}
                            onClick={() => store.setActiveHeading(child.id)}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
