/**
 * Profiles State Slice
 *
 * Manages browser profile state for the automation playground.
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

export interface ProfilesSliceState {
  profiles: ProfileSummary[];
  selectedProfileName: string | null;
  isLoadingProfiles: boolean;
  isCreatingProfile: boolean;
  profileError: string | null;
  profileDialogOpen: boolean;
  editingProfile: ProfileSummary | null;
}

export interface ProfilesSliceActions {
  fetchProfiles: () => Promise<void>;
  createProfile: (profile: ProfileFormData) => Promise<void>;
  updateProfile: (name: string, updates: Partial<ProfileFormData>) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;
  selectProfile: (name: string | null) => void;
  openProfileDialog: (profile?: ProfileSummary) => void;
  closeProfileDialog: () => void;
  setProfileError: (error: string | null) => void;
}

export type ProfilesSlice = ProfilesSliceState & ProfilesSliceActions;

export const createProfilesSlice: StateCreator<
  BrowserStore,
  [],
  [],
  ProfilesSlice
> = (set, get) => ({
  // State
  profiles: [],
  selectedProfileName: null,
  isLoadingProfiles: false,
  isCreatingProfile: false,
  profileError: null,
  profileDialogOpen: false,
  editingProfile: null,

  // Actions
  fetchProfiles: async () => {
    set({ isLoadingProfiles: true, profileError: null });
    try {
      const response = await fetch("/api/browser-automation/profiles");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch profiles");
      }

      set({ profiles: data.profiles || [], isLoadingProfiles: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch profiles";
      console.error("Failed to fetch profiles:", message);
      set({ profileError: message, isLoadingProfiles: false });
    }
  },

  createProfile: async (profile) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      console.error("Failed to create profile:", message);
      set({ profileError: message, isCreatingProfile: false });
      throw error;
    }
  },

  updateProfile: async (name, updates) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      console.error("Failed to update profile:", message);
      set({ profileError: message });
      throw error;
    }
  },

  deleteProfile: async (name) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      console.error("Failed to delete profile:", message);
      set({ profileError: message });
      throw error;
    }
  },

  selectProfile: (name) => set({ selectedProfileName: name }),

  openProfileDialog: (profile) =>
    set({
      profileDialogOpen: true,
      editingProfile: profile || null,
      profileError: null,
    }),

  closeProfileDialog: () =>
    set({
      profileDialogOpen: false,
      editingProfile: null,
    }),

  setProfileError: (error) => set({ profileError: error }),
});
