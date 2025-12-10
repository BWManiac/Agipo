"use client";

import { useState } from "react";
import { useBrowserStore } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { ProfilePicker } from "../Profiles";

export function NewSessionDialog() {
  const isOpen = useBrowserStore((state) => state.newSessionDialogOpen);
  const closeDialog = useBrowserStore((state) => state.closeNewSessionDialog);
  const createSession = useBrowserStore((state) => state.createSession);
  const isCreating = useBrowserStore((state) => state.isCreating);
  const selectedProfileName = useBrowserStore((state) => state.selectedProfileName);

  const [initialUrl, setInitialUrl] = useState("");

  const handleCreate = async () => {
    try {
      await createSession(selectedProfileName || undefined, initialUrl || undefined);
      setInitialUrl("");
      closeDialog();
    } catch (error) {
      // Error is handled in store
      console.error("Failed to create session:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
      setInitialUrl("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Browser Session</DialogTitle>
          <DialogDescription>
            Start a new cloud browser session. You can optionally specify an
            initial URL to navigate to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="initial-url">Initial URL (optional)</Label>
            <Input
              id="initial-url"
              type="url"
              placeholder="https://google.com"
              value={initialUrl}
              onChange={(e) => setInitialUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to start with a blank page
            </p>
          </div>

          {/* Profile Picker */}
          <div className="space-y-2">
            <Label>Browser Profile</Label>
            <ProfilePicker />
            <p className="text-xs text-muted-foreground">
              Profiles persist cookies and login sessions
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              "Start Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
