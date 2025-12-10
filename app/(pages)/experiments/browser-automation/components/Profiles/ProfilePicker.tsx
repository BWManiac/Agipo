"use client";

import { useEffect } from "react";
import { useBrowserStore } from "../../store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";

interface ProfilePickerProps {
  onCreateNew?: () => void;
}

export function ProfilePicker({ onCreateNew }: ProfilePickerProps) {
  const profiles = useBrowserStore((state) => state.profiles);
  const selectedProfileName = useBrowserStore((state) => state.selectedProfileName);
  const selectProfile = useBrowserStore((state) => state.selectProfile);
  const fetchProfiles = useBrowserStore((state) => state.fetchProfiles);
  const isLoadingProfiles = useBrowserStore((state) => state.isLoadingProfiles);
  const openProfileDialog = useBrowserStore((state) => state.openProfileDialog);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleValueChange = (value: string) => {
    if (value === "__none__") {
      selectProfile(null);
    } else {
      selectProfile(value);
    }
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      openProfileDialog();
    }
  };

  return (
    <div className="flex gap-2">
      <Select
        value={selectedProfileName || "__none__"}
        onValueChange={handleValueChange}
        disabled={isLoadingProfiles}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a profile">
            {selectedProfileName ? (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {profiles.find((p) => p.name === selectedProfileName)?.displayName ||
                  selectedProfileName}
              </span>
            ) : (
              "Default (no profile)"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Default (no profile)</span>
          </SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.name} value={profile.name}>
              <span className="flex items-center gap-2">
                <span>{profile.icon || "👤"}</span>
                <span>{profile.displayName}</span>
                {profile.credentialCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({profile.credentialCount} credential{profile.credentialCount !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCreateNew}
        title="Create new profile"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
