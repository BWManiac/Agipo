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
import { Loader2, Info } from "lucide-react";
import { ProfilePicker } from "../Profiles";

type ProfileOption = "none" | "existing" | "create";

export function NewSessionDialog() {
  const isOpen = useBrowserStore((state) => state.newSessionDialogOpen);
  const closeDialog = useBrowserStore((state) => state.closeNewSessionDialog);
  const createSession = useBrowserStore((state) => state.createSession);
  const isCreating = useBrowserStore((state) => state.isCreating);
  const selectedProfileName = useBrowserStore((state) => state.selectedProfileName);
  const selectProfile = useBrowserStore((state) => state.selectProfile);

  const [initialUrl, setInitialUrl] = useState("");
  const [profileOption, setProfileOption] = useState<ProfileOption>("none");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDisplayName, setNewProfileDisplayName] = useState("");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  // Validate profile name format
  const validateProfileName = (name: string): boolean => {
    if (!name) return false;
    if (!/^[a-z0-9-]+$/.test(name)) {
      setProfileNameError("Lowercase letters, numbers, and dashes only");
      return false;
    }
    if (name.length < 2) {
      setProfileNameError("Name must be at least 2 characters");
      return false;
    }
    setProfileNameError(null);
    return true;
  };

  const handleCreate = async () => {
    try {
      if (profileOption === "create") {
        if (!validateProfileName(newProfileName)) return;

        await createSession({
          profileName: newProfileName,
          profileDisplayName: newProfileDisplayName || newProfileName,
          initialUrl: initialUrl || undefined,
          createNewProfile: true,
        });
      } else if (profileOption === "existing" && selectedProfileName) {
        await createSession({
          profileName: selectedProfileName,
          initialUrl: initialUrl || undefined,
          createNewProfile: false,
        });
      } else {
        // No profile
        await createSession({
          initialUrl: initialUrl || undefined,
        });
      }

      // Reset form
      setInitialUrl("");
      setProfileOption("none");
      setNewProfileName("");
      setNewProfileDisplayName("");
      setProfileNameError(null);
      closeDialog();
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
      setInitialUrl("");
      setProfileOption("none");
      setNewProfileName("");
      setNewProfileDisplayName("");
      setProfileNameError(null);
    }
  };

  const handleProfileOptionChange = (option: ProfileOption) => {
    setProfileOption(option);
    if (option !== "existing") {
      selectProfile(null);
    }
  };

  const canCreate =
    profileOption === "none" ||
    (profileOption === "existing" && selectedProfileName) ||
    (profileOption === "create" && newProfileName && !profileNameError);

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
          {/* Initial URL */}
          <div className="space-y-2">
            <Label htmlFor="initial-url">Initial URL (optional)</Label>
            <Input
              id="initial-url"
              type="url"
              placeholder="https://linkedin.com"
              value={initialUrl}
              onChange={(e) => setInitialUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to start with a blank page
            </p>
          </div>

          {/* Profile Options */}
          <div className="space-y-3">
            <Label>Browser Profile</Label>

            {/* Option 1: No Profile */}
            <label
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                profileOption === "none"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="profile-option"
                checked={profileOption === "none"}
                onChange={() => handleProfileOptionChange("none")}
                className="mt-0.5 mr-3"
              />
              <div>
                <span className="font-medium text-sm">No profile</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fresh browser, no saved state
                </p>
              </div>
            </label>

            {/* Option 2: Use Existing */}
            <label
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                profileOption === "existing"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="profile-option"
                checked={profileOption === "existing"}
                onChange={() => handleProfileOptionChange("existing")}
                className="mt-0.5 mr-3"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">Use existing profile</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start already logged in
                </p>
                {profileOption === "existing" && (
                  <div className="mt-2">
                    <ProfilePicker />
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Create New */}
            <label
              className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                profileOption === "create"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="profile-option"
                checked={profileOption === "create"}
                onChange={() => handleProfileOptionChange("create")}
                className="mt-0.5 mr-3"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">Create new profile</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Save browser state when session ends
                </p>
                {profileOption === "create" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Input
                        placeholder="linkedin-work"
                        value={newProfileName}
                        onChange={(e) => {
                          setNewProfileName(e.target.value.toLowerCase());
                          if (e.target.value) validateProfileName(e.target.value.toLowerCase());
                        }}
                        className={profileNameError ? "border-destructive" : ""}
                      />
                      {profileNameError ? (
                        <p className="text-xs text-destructive mt-1">{profileNameError}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Profile identifier (cannot be changed)
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="LinkedIn - Work Account"
                        value={newProfileDisplayName}
                        onChange={(e) => setNewProfileDisplayName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Display name (optional)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Info Box */}
          {profileOption === "create" && (
            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg border">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong>How it works:</strong> Log into sites during your session.
                When you end the session, all cookies and login state will be saved
                to this profile. Next time, select this profile to start already logged in.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !canCreate}>
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
