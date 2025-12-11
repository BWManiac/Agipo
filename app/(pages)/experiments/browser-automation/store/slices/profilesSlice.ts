/**
 * Profiles Slice
 * Manages browser profile state for the automation playground.
 * Handles CRUD operations for browser profiles (credentials, viewport settings, etc.).
 * Powers the profile management UI where users create and configure browser profiles.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../types";

export interface ProfileSummary {
  name: string;
  displayName: string;
  icon: string;
  credentialCount: number;
  createdAt: string;
  lastUsed?: string;
}

export interface ProfileCredential {
  id: string;
  label: string;
  username: string;
  password: string;
  domain?: string;
}

export interface ProfileFormData {
  name: string;
  displayName: string;
  icon: string;
  credentials: ProfileCredential[];
  config?: {
    viewport?: { width: number; height: number };
    proxy?: { active: boolean; type?: string };
  };
}

// 1. State Interface
export interface ProfilesSliceState {
  profiles: ProfileSummary[];
  // Array of all browser profiles. Powers the profile list display.
  selectedProfileName: string | null;
  // Name of currently selected profile. Null when no profile is selected.
  isLoadingProfiles: boolean;
  // Indicates if profiles are being fetched from API. Used to show loading state.
  isCreatingProfile: boolean;
  // Indicates if a profile creation is in progress. Used to disable form and show loading.
  profileError: string | null;
  // Error message if profile operation fails. Null when no error.
  profileDialogOpen: boolean;
  // Whether the profile create/edit dialog is open. Controls dialog visibility.
  editingProfile: ProfileSummary | null;
  // Profile being edited (if any). Null when creating new profile.
}

// 2. Actions Interface
export interface ProfilesSliceActions {
  fetchProfiles: () => Promise<void>;
  // Fetches all profiles from the API. Called when profile list needs to be refreshed.
  createProfile: (profile: ProfileFormData) => Promise<void>;
  // Creates a new browser profile. Called when user submits profile creation form.
  updateProfile: (name: string, updates: Partial<ProfileFormData>) => Promise<void>;
  // Updates an existing profile. Called when user saves profile edits.
  deleteProfile: (name: string) => Promise<void>;
  // Deletes a profile. Called when user confirms profile deletion.
  selectProfile: (name: string | null) => void;
  // Selects a profile to use for new sessions. Called when user selects profile from list.
  openProfileDialog: (profile?: ProfileSummary) => void;
  // Opens the profile create/edit dialog. Called when user clicks create/edit button.
  closeProfileDialog: () => void;
  // Closes the profile dialog. Called when user cancels or saves profile.
  setProfileError: (error: string | null) => void;
  // Sets profile error message. Called when profile operation fails.
}

// 3. Combined Slice Type
export type ProfilesSlice = ProfilesSliceState & ProfilesSliceActions;

// 4. Initial State
const initialState: ProfilesSliceState = {
  profiles: [], // Start with empty profiles list - will be fetched from API
  selectedProfileName: null, // No profile selected initially - user hasn't chosen one yet
  isLoadingProfiles: false, // Not loading initially - will start loading when component mounts
  isCreatingProfile: false, // Not creating initially - user hasn't started creating profile yet
  profileError: null, // No error initially - clean state
  profileDialogOpen: false, // Dialog closed initially - user hasn't opened it yet
  editingProfile: null, // Not editing initially - no profile being edited
};

// 5. Slice Creator
export const createProfilesSlice: StateCreator<
  BrowserStore,
  [],
  [],
  ProfilesSlice
> = (set, get) => ({
  ...initialState,

  fetchProfiles: async () => {
    console.log("📋 ProfilesSlice: Fetching profiles");
    set({ isLoadingProfiles: true, profileError: null });
    try {
      const response = await fetch("/api/browser-automation/profiles");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profiles");
      }

      set({ profiles: data.profiles || [], isLoadingProfiles: false });
      console.log("✅ ProfilesSlice: Profiles fetched:", data.profiles?.length || 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch profiles";
      console.error("❌ ProfilesSlice: Failed to fetch profiles:", message);
      set({ profileError: message, isLoadingProfiles: false });
    }
  },

  createProfile: async (profile) => {
    console.log("📝 ProfilesSlice: Creating profile:", profile.name);
    set({ isCreatingProfile: true, profileError: null });
    try {
      const response = await fetch("/api/browser-automation/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create profile");
      }

      // Add to list and select
      set((state) => ({
        profiles: [...state.profiles, data.profile],
        selectedProfileName: data.profile.name,
        isCreatingProfile: false,
        profileDialogOpen: false,
      }));
      console.log("✅ ProfilesSlice: Profile created successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      console.error("❌ ProfilesSlice: Failed to create profile:", message);
      set({ profileError: message, isCreatingProfile: false });
      throw error;
    }
  },

  updateProfile: async (name, updates) => {
    console.log("🔄 ProfilesSlice: Updating profile:", name);
    set({ profileError: null });
    try {
      const response = await fetch(`/api/browser-automation/profiles/${name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update in list
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.name === name ? { ...p, ...data.profile } : p
        ),
        profileDialogOpen: false,
        editingProfile: null,
      }));
      console.log("✅ ProfilesSlice: Profile updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      console.error("❌ ProfilesSlice: Failed to update profile:", message);
      set({ profileError: message });
      throw error;
    }
  },

  deleteProfile: async (name) => {
    console.log("🗑️ ProfilesSlice: Deleting profile:", name);
    try {
      const response = await fetch(`/api/browser-automation/profiles/${name}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete profile");
      }

      set((state) => ({
        profiles: state.profiles.filter((p) => p.name !== name),
        selectedProfileName:
          state.selectedProfileName === name ? null : state.selectedProfileName,
      }));
      console.log("✅ ProfilesSlice: Profile deleted successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      console.error("❌ ProfilesSlice: Failed to delete profile:", message);
      set({ profileError: message });
      throw error;
    }
  },

  selectProfile: (name) => {
    console.log("📌 ProfilesSlice: Selecting profile:", name);
    set({ selectedProfileName: name });
  },

  openProfileDialog: (profile) => {
    console.log("📝 ProfilesSlice: Opening profile dialog:", profile?.name || "new");
    set({
      profileDialogOpen: true,
      editingProfile: profile || null,
      profileError: null,
    });
  },

  closeProfileDialog: () => {
    console.log("❌ ProfilesSlice: Closing profile dialog");
    set({
      profileDialogOpen: false,
      editingProfile: null,
    });
  },

  setProfileError: (error) => {
    if (error) {
      console.error("❌ ProfilesSlice: Setting profile error:", error);
    }
    set({ profileError: error });
  },
});
