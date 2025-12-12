"use client";

/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs for folder hierarchy.
 * Based on 01-folder-view.html mockup.
 */

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreadcrumbItem } from "@/app/api/records/types";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.id ?? "root"} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isLast ? (
              <span className="font-medium px-1.5 py-0.5">{item.name}</span>
            ) : (
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  "px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
                )}
              >
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
