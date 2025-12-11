"use client";

import { useState, useEffect } from "react";
import { useDocsStore } from "../../store";
import { Input } from "@/components/ui/input";

export function TitleEditor() {
  const store = useDocsStore();
  const { title } = store;
  const [localTitle, setLocalTitle] = useState(title);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleBlur = () => {
    if (localTitle !== title) {
      store.updateTitle(localTitle);
      // TODO: Save title via API
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Input
      value={localTitle}
      onChange={(e) => setLocalTitle(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
      placeholder="Untitled Document"
    />
  );
}
