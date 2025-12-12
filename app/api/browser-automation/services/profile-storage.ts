/**
 * Profile Storage Service
 *
 * Manages browser profiles with encrypted credential storage.
 */

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const PROFILES_DIR = path.join(process.cwd(), "_tables/browser-profiles");
const ENCRYPTION_KEY =
  process.env.PROFILE_ENCRYPTION_KEY || "default-key-change-in-production";

// Encryption helpers
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `encrypted:${iv.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  if (!encryptedText.startsWith("encrypted:")) return encryptedText;
  const parts = encryptedText.slice(10).split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
    iv
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface ProfileCredential {
  id: string;
  label: string;
  username: string;
  password: string;
  domain?: string;
}

export interface ProfileConfig {
  name: string;
  displayName: string;
  icon: string;
  credentials: ProfileCredential[];
  config: {
    viewport?: { width: number; height: number };
    proxy?: { active: boolean; type?: string };
  };
  createdAt: string;
  lastUsed?: string;
}

export interface ProfileSummary {
  name: string;
  displayName: string;
  icon: string;
  credentialCount: number;
  createdAt: string;
  lastUsed?: string;
}

/**
 * Ensure profiles directory exists
 */
async function ensureProfilesDir(): Promise<void> {
  await fs.mkdir(PROFILES_DIR, { recursive: true });
}

/**
 * List all profiles (summaries only)
 */
export async function listProfiles(): Promise<ProfileSummary[]> {
  try {
    await ensureProfilesDir();
    const indexPath = path.join(PROFILES_DIR, "index.json");

    try {
      const content = await fs.readFile(indexPath, "utf-8");
      const registry = JSON.parse(content);
      const profileNames: string[] = registry.profiles || [];

      const profiles = await Promise.all(
        profileNames.map((name) => getProfile(name))
      );

      return profiles
        .filter((p): p is ProfileConfig => p !== null)
        .map((p) => ({
          name: p.name,
          displayName: p.displayName,
          icon: p.icon,
          credentialCount: p.credentials.length,
          createdAt: p.createdAt,
          lastUsed: p.lastUsed,
        }));
    } catch {
      // No profiles yet
      return [];
    }
  } catch {
    return [];
  }
}

/**
 * Get a single profile (passwords masked)
 */
export async function getProfile(name: string): Promise<ProfileConfig | null> {
  try {
    const configPath = path.join(PROFILES_DIR, name, "config.json");
    const content = await fs.readFile(configPath, "utf-8");
    const config: ProfileConfig = JSON.parse(content);

    // Mask passwords for API response
    config.credentials = config.credentials.map((c) => ({
      ...c,
      password: "••••••••",
    }));

    return config;
  } catch {
    return null;
  }
}

/**
 * Create a new profile
 */
export async function createProfile(
  config: Omit<ProfileConfig, "createdAt">
): Promise<ProfileConfig> {
  await ensureProfilesDir();

  const profileDir = path.join(PROFILES_DIR, config.name);
  await fs.mkdir(profileDir, { recursive: true });

  // Encrypt passwords
  const credentialsWithEncrypted = config.credentials.map((c) => ({
    ...c,
    password: encrypt(c.password),
  }));

  const fullConfig: ProfileConfig = {
    ...config,
    credentials: credentialsWithEncrypted,
    createdAt: new Date().toISOString(),
  };

  // Write config file
  await fs.writeFile(
    path.join(profileDir, "config.json"),
    JSON.stringify(fullConfig, null, 2)
  );

  // Update registry
  await updateRegistry(config.name, "add");

  // Return with masked passwords
  return {
    ...fullConfig,
    credentials: fullConfig.credentials.map((c) => ({
      ...c,
      password: "••••••••",
    })),
  };
}

/**
 * Update an existing profile
 */
export async function updateProfile(
  name: string,
  updates: Partial<Omit<ProfileConfig, "name" | "createdAt">>
): Promise<ProfileConfig> {
  const configPath = path.join(PROFILES_DIR, name, "config.json");

  // Read existing (with encrypted passwords)
  const existingContent = await fs.readFile(configPath, "utf-8");
  const existing: ProfileConfig = JSON.parse(existingContent);

  // Merge updates
  const updated = { ...existing, ...updates };

  // Re-encrypt passwords if provided
  if (updates.credentials) {
    updated.credentials = updates.credentials.map((c) => ({
      ...c,
      password: c.password.startsWith("encrypted:")
        ? c.password
        : c.password === "••••••••"
        ? existing.credentials.find((ec) => ec.id === c.id)?.password ||
          encrypt(c.password)
        : encrypt(c.password),
    }));
  }

  // Write updated config
  await fs.writeFile(configPath, JSON.stringify(updated, null, 2));

  // Return with masked passwords
  return {
    ...updated,
    credentials: updated.credentials.map((c) => ({
      ...c,
      password: "••••••••",
    })),
  };
}

/**
 * Delete a profile
 */
export async function deleteProfile(name: string): Promise<void> {
  const profileDir = path.join(PROFILES_DIR, name);
  await fs.rm(profileDir, { recursive: true, force: true });
  await updateRegistry(name, "remove");
}

/**
 * Update the profiles registry
 */
async function updateRegistry(
  name: string,
  action: "add" | "remove"
): Promise<void> {
  await ensureProfilesDir();
  const indexPath = path.join(PROFILES_DIR, "index.json");

  let profiles: string[] = [];
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const registry = JSON.parse(content);
    profiles = registry.profiles || [];
  } catch {
    // File doesn't exist, start fresh
  }

  if (action === "add" && !profiles.includes(name)) {
    profiles.push(name);
  } else if (action === "remove") {
    profiles = profiles.filter((p) => p !== name);
  }

  await fs.writeFile(indexPath, JSON.stringify({ profiles }, null, 2));
}

/**
 * Get credentials for agent use (decrypted)
 */
export async function getProfileCredentials(
  name: string
): Promise<ProfileCredential[]> {
  try {
    const configPath = path.join(PROFILES_DIR, name, "config.json");
    const content = await fs.readFile(configPath, "utf-8");
    const config: ProfileConfig = JSON.parse(content);

    return config.credentials.map((c) => ({
      ...c,
      password: decrypt(c.password),
    }));
  } catch {
    return [];
  }
}

/**
 * Update last used timestamp for a profile
 */
export async function touchProfile(name: string): Promise<void> {
  try {
    const configPath = path.join(PROFILES_DIR, name, "config.json");
    const content = await fs.readFile(configPath, "utf-8");
    const config: ProfileConfig = JSON.parse(content);
    config.lastUsed = new Date().toISOString();
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// Anchor Profile Management (Saved Sessions)
// =============================================================================
// These profiles store browser state (cookies, localStorage) on Anchor's servers.
// We track metadata locally to know which profiles exist.

const ANCHOR_PROFILES_FILE = path.join(PROFILES_DIR, "anchor-profiles.json");

export interface AnchorProfileMeta {
  name: string; // Anchor profile identifier (e.g., "linkedin-work")
  displayName: string; // Human-readable name (e.g., "LinkedIn - Work Account")
  description?: string;
  createdAt: string;
  lastUsed?: string;
}

/**
 * Read Anchor profiles from local storage
 */
async function readAnchorProfiles(): Promise<AnchorProfileMeta[]> {
  try {
    await ensureProfilesDir();
    const content = await fs.readFile(ANCHOR_PROFILES_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Write Anchor profiles to local storage
 */
async function writeAnchorProfiles(profiles: AnchorProfileMeta[]): Promise<void> {
  await ensureProfilesDir();
  await fs.writeFile(ANCHOR_PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

/**
 * Register a new Anchor profile (after creating session with persist: true)
 */
export async function registerAnchorProfile(
  name: string,
  displayName: string,
  description?: string
): Promise<AnchorProfileMeta> {
  const profiles = await readAnchorProfiles();

  // Check if already exists
  const existing = profiles.find((p) => p.name === name);
  if (existing) {
    // Update display name if changed
    existing.displayName = displayName;
    if (description) existing.description = description;
    existing.lastUsed = new Date().toISOString();
    await writeAnchorProfiles(profiles);
    return existing;
  }

  // Create new
  const newProfile: AnchorProfileMeta = {
    name,
    displayName,
    description,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };

  profiles.push(newProfile);
  await writeAnchorProfiles(profiles);
  return newProfile;
}

/**
 * List all Anchor profiles (metadata only - actual state is on Anchor servers)
 */
export async function listAnchorProfiles(): Promise<AnchorProfileMeta[]> {
  return readAnchorProfiles();
}

/**
 * Update lastUsed timestamp for an Anchor profile
 */
export async function touchAnchorProfile(name: string): Promise<void> {
  const profiles = await readAnchorProfiles();
  const profile = profiles.find((p) => p.name === name);
  if (profile) {
    profile.lastUsed = new Date().toISOString();
    await writeAnchorProfiles(profiles);
  }
}

/**
 * Delete an Anchor profile (local metadata only - call Anchor API separately)
 */
export async function deleteAnchorProfile(name: string): Promise<void> {
  const profiles = await readAnchorProfiles();
  const filtered = profiles.filter((p) => p.name !== name);
  await writeAnchorProfiles(filtered);
}
