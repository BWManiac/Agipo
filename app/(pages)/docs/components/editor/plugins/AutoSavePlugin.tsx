"use client";

import { useEffect, useRef } from "react";
import { useDocsStore } from "../../../store";

interface AutoSavePluginProps {
  debounceMs?: number;
}

export function AutoSavePlugin({ debounceMs = 1500 }: AutoSavePluginProps) {
  const document = useDocsStore((state) => state.document);
  const isDirty = useDocsStore((state) => state.isDirty);
  const save = useDocsStore((state) => state.save);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Debounced auto-save on content changes
  useEffect(() => {
    // Skip first render (initial load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isDirty || !document) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, debounceMs, save, document]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
