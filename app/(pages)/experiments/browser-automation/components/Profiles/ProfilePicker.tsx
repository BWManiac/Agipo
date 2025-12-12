"use client";

import { useEffect } from "react";
import { useBrowserStore } from "../../store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, User, Globe, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfilePickerProps {
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

export function ProfilePicker({ onCreateNew, showCreateButton = false }: ProfilePickerProps) {
  const profiles = useBrowserStore((state) => state.profiles);
  const selectedProfileName = useBrowserStore((state) => state.selectedProfileName);
  const selectProfile = useBrowserStore((state) => state.selectProfile);
  const fetchProfiles = useBrowserStore((state) => state.fetchProfiles);
  const isLoadingProfiles = useBrowserStore((state) => state.isLoadingProfiles);
  const openProfileDialog = useBrowserStore((state) => state.openProfileDialog);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Separate profiles by type
  const anchorProfiles = profiles.filter((p) => p.type === "anchor");
  const localProfiles = profiles.filter((p) => p.type === "local");

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

  const selectedProfile = profiles.find((p) => p.name === selectedProfileName);

  return (
    <div className="flex gap-2">
      <Select
        value={selectedProfileName || "__none__"}
        onValueChange={handleValueChange}
        disabled={isLoadingProfiles}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a profile">
            {selectedProfile ? (
              <span className="flex items-center gap-2">
                {selectedProfile.type === "anchor" ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <KeyRound className="h-4 w-4 text-blue-600" />
                )}
                <span>{selectedProfile.displayName}</span>
              </span>
            ) : (
              "Select a profile..."
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">No profile selected</span>
          </SelectItem>

          {/* Saved Sessions (Anchor Profiles) */}
          {anchorProfiles.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1.5">
                Saved Sessions
              </SelectLabel>
              {anchorProfiles.map((profile) => (
                <SelectItem key={profile.name} value={profile.name}>
                  <span className="flex items-center gap-2 w-full">
                    <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="flex-1 truncate">{profile.displayName}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-700 border-green-200">
                      Saved
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Credential Profiles */}
          {localProfiles.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1.5">
                Credential Profiles
              </SelectLabel>
              {localProfiles.map((profile) => (
                <SelectItem key={profile.name} value={profile.name}>
                  <span className="flex items-center gap-2 w-full">
                    <span className="flex-shrink-0">{profile.icon || "👤"}</span>
                    <span className="flex-1 truncate">{profile.displayName}</span>
                    {profile.credentialCount && profile.credentialCount > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                        {profile.credentialCount} cred
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Empty state */}
          {profiles.length === 0 && !isLoadingProfiles && (
            <div className="py-4 px-2 text-center">
              <p className="text-sm text-muted-foreground">No profiles yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a new profile to save login sessions
              </p>
            </div>
          )}
        </SelectContent>
      </Select>

      {showCreateButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleCreateNew}
          title="Create new credential profile"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
