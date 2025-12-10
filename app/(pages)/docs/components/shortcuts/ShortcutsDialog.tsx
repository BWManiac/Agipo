"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocsStore } from "../../store";
import { KEYBOARD_SHORTCUTS, SHORTCUT_CATEGORIES } from "./shortcuts-data";

export function ShortcutsDialog() {
  const isShortcutsOpen = useDocsStore((state) => state.isShortcutsOpen);
  const setShortcutsOpen = useDocsStore((state) => state.setShortcutsOpen);

  return (
    <Dialog open={isShortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h4>
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.filter((s) => s.category === category).map(
                  (shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <kbd
                            key={index}
                            className="px-2 py-1 text-xs bg-muted rounded border border-border font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
