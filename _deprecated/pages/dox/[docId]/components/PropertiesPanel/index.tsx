"use client";

import { useDocsStore } from "../../store";
import { PropertyField } from "./PropertyField";
import { PropertyAdd } from "./PropertyAdd";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PropertiesPanel() {
  const store = useDocsStore();
  const { properties, propertiesCollapsed, toggleProperties } = store;

  if (propertiesCollapsed) {
    return (
      <div className="w-12 border-l flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleProperties}
          className="-rotate-90"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-l flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Properties</h2>
        <Button variant="ghost" size="icon" onClick={toggleProperties}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.entries(properties).map(([key, value]) => (
            <PropertyField key={key} propertyKey={key} value={value} />
          ))}
          <PropertyAdd />
        </div>
      </ScrollArea>
    </div>
  );
}
