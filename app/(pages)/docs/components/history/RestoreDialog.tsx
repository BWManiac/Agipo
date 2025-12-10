"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocsStore } from "../../store";

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
  versionId: string;
}

export function RestoreDialog({
  open,
  onOpenChange,
  docId,
  versionId,
}: RestoreDialogProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreVersion = useDocsStore((state) => state.restoreVersion);
  const setHistoryOpen = useDocsStore((state) => state.setHistoryOpen);

  const handleRestore = async () => {
    setIsRestoring(true);
    const success = await restoreVersion(docId, versionId);
    setIsRestoring(false);

    if (success) {
      onOpenChange(false);
      setHistoryOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this version?</AlertDialogTitle>
          <AlertDialogDescription>
            Your current document will be replaced with this version. A backup
            of your current content will be saved to version history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
            {isRestoring ? "Restoring..." : "Restore"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
