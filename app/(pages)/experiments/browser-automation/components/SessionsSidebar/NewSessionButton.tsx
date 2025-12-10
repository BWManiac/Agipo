"use client";

import { useBrowserStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function NewSessionButton() {
  const openNewSessionDialog = useBrowserStore(
    (state) => state.openNewSessionDialog
  );
  const isCreating = useBrowserStore((state) => state.isCreating);

  return (
    <Button
      onClick={openNewSessionDialog}
      disabled={isCreating}
      className="w-full"
      size="sm"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </>
      )}
    </Button>
  );
}
