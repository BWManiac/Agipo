/**
 * Profiles API
 *
 * GET /api/browser-automation/profiles - List all profiles
 * POST /api/browser-automation/profiles - Create a new profile
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listProfiles, createProfile, listAnchorProfiles } from "../services/profile-storage";

// Combined profile type for API response
export interface CombinedProfile {
  name: string;
  displayName: string;
  type: "anchor" | "local"; // anchor = saved session, local = credential profile
  icon?: string;
  credentialCount?: number;
  description?: string;
  createdAt: string;
  lastUsed?: string;
}

const CreateProfileSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with dashes"),
  displayName: z.string().min(1),
  icon: z.string().default("💼"),
  credentials: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        username: z.string(),
        password: z.string(),
        domain: z.string().optional(),
      })
    )
    .default([]),
  config: z
    .object({
      viewport: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
      proxy: z
        .object({
          active: z.boolean(),
          type: z.string().optional(),
        })
        .optional(),
    })
    .default({}),
});

export async function GET() {
  try {
    // Get both types of profiles
    const [localProfiles, anchorProfiles] = await Promise.all([
      listProfiles(),
      listAnchorProfiles(),
    ]);

    // Combine into unified list with type indicator
    const combinedProfiles: CombinedProfile[] = [
      // Anchor profiles (saved sessions) - show first as they're more reliable
      ...anchorProfiles.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        type: "anchor" as const,
        description: p.description,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
      })),
      // Local credential profiles
      ...localProfiles.map((p) => ({
        name: p.name,
        displayName: p.displayName,
        type: "local" as const,
        icon: p.icon,
        credentialCount: p.credentialCount,
        createdAt: p.createdAt,
        lastUsed: p.lastUsed,
      })),
    ];

    // Sort by lastUsed (most recent first), then by createdAt
    combinedProfiles.sort((a, b) => {
      const aTime = a.lastUsed || a.createdAt;
      const bTime = b.lastUsed || b.createdAt;
      return bTime.localeCompare(aTime);
    });

    return NextResponse.json({ profiles: combinedProfiles });
  } catch (error) {
    console.error("[Profiles] List error:", error);
    return NextResponse.json(
      { error: "Failed to list profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.format() },
        { status: 400 }
      );
    }

    const profile = await createProfile(validated.data);

    return NextResponse.json({
      success: true,
      profile: {
        name: profile.name,
        displayName: profile.displayName,
        icon: profile.icon,
        credentialCount: profile.credentials.length,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    console.error("[Profiles] Create error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
