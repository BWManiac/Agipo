"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface Credential {
  id: string;
  label: string;
  username: string;
  password: string;
  domain?: string;
}

const ICONS = ["👤", "🏢", "🔒", "💼", "🌐", "📧", "🛒", "💳"];

export function ProfileDialog() {
  const isOpen = useBrowserStore((state) => state.profileDialogOpen);
  const closeDialog = useBrowserStore((state) => state.closeProfileDialog);
  const createProfile = useBrowserStore((state) => state.createProfile);
  const updateProfile = useBrowserStore((state) => state.updateProfile);
  const editingProfile = useBrowserStore((state) => state.editingProfile);
  const isCreating = useBrowserStore((state) => state.isCreatingProfile);
  const error = useBrowserStore((state) => state.profileError);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState("👤");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const isEditing = !!editingProfile;

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setDisplayName(editingProfile.displayName);
      setIcon(editingProfile.icon || "👤");
      // Note: credentials are fetched separately for security
      setCredentials([]);
    } else {
      resetForm();
    }
  }, [editingProfile, isOpen]);

  const resetForm = () => {
    setName("");
    setDisplayName("");
    setIcon("👤");
    setCredentials([]);
    setShowPasswords({});
  };

  const handleClose = () => {
    closeDialog();
    resetForm();
  };

  const addCredential = () => {
    const newCred: Credential = {
      id: `cred_${Date.now()}`,
      label: "",
      username: "",
      password: "",
      domain: "",
    };
    setCredentials([...credentials, newCred]);
  };

  const updateCredential = (id: string, updates: Partial<Credential>) => {
    setCredentials(
      credentials.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeCredential = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id));
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    const profileData = {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      displayName: displayName || name,
      icon,
      credentials,
    };

    try {
      if (isEditing) {
        await updateProfile(editingProfile.name, profileData);
      } else {
        await createProfile(profileData);
      }
      handleClose();
    } catch {
      // Error handled in store
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Profile" : "Create Browser Profile"}
          </DialogTitle>
          <DialogDescription>
            Browser profiles persist cookies, localStorage, and login sessions
            across browser sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Profile Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-md border text-xl flex items-center justify-center transition-colors ${
                    icon === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              placeholder="work-profile"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEditing}
            />
            <p className="text-xs text-muted-foreground">
              Used as identifier. Cannot be changed after creation.
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Work Profile"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Saved Credentials (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCredential}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {credentials.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                No saved credentials. Add credentials to auto-fill login forms.
              </p>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-3 border rounded-md space-y-2 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        placeholder="Label (e.g., Gmail)"
                        value={cred.label}
                        onChange={(e) =>
                          updateCredential(cred.id, { label: e.target.value })
                        }
                        className="flex-1 mr-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCredential(cred.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Username / Email"
                        value={cred.username}
                        onChange={(e) =>
                          updateCredential(cred.id, { username: e.target.value })
                        }
                      />
                      <div className="relative">
                        <Input
                          type={showPasswords[cred.id] ? "text" : "password"}
                          placeholder="Password"
                          value={cred.password}
                          onChange={(e) =>
                            updateCredential(cred.id, { password: e.target.value })
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(cred.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPasswords[cred.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Input
                      placeholder="Domain (optional, e.g., google.com)"
                      value={cred.domain || ""}
                      onChange={(e) =>
                        updateCredential(cred.id, { domain: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !isValid}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Saving..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Profile"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
