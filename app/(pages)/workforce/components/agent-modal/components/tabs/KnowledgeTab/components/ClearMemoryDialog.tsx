"use client";

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

interface ClearMemoryDialogProps {
  open: boolean;
  agentName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ClearMemoryDialog({
  open,
  agentName,
  onOpenChange,
  onConfirm,
}: ClearMemoryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all knowledge?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently erase everything {agentName} has learned about
            you, including communication preferences, project context, and
            decisions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Clear All Knowledge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

