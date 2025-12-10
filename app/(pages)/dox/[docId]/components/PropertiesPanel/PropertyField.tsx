"use client";

import { useDocsStore } from "../../store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PropertyFieldProps {
  propertyKey: string;
  value: unknown;
}

export function PropertyField({ propertyKey, value }: PropertyFieldProps) {
  const store = useDocsStore();
  const [localValue, setLocalValue] = useState(String(value || ""));

  const handleBlur = () => {
    store.updateProperty(propertyKey, localValue);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase">
        {propertyKey}
      </Label>
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="h-8"
      />
    </div>
  );
}
