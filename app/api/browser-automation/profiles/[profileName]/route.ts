/**
 * Individual Profile API
 *
 * GET    /api/browser-automation/profiles/[profileName] - Get profile details
 * PUT    /api/browser-automation/profiles/[profileName] - Update profile
 * DELETE /api/browser-automation/profiles/[profileName] - Delete profile
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../../services/profile-storage";

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  icon: z.string().optional(),
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
    .optional(),
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
    .optional(),
});

type RouteContext = {
  params: Promise<{ profileName: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { profileName } = await context.params;
    const profile = await getProfile(profileName);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[Profiles] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { profileName } = await context.params;
    const body = await request.json();
    const validated = UpdateProfileSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateProfile(profileName, validated.data);

    return NextResponse.json({
      success: true,
      profile: {
        name: updated.name,
        displayName: updated.displayName,
        icon: updated.icon,
        credentialCount: updated.credentials.length,
      },
    });
  } catch (error) {
    console.error("[Profiles] Update error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { profileName } = await context.params;
    await deleteProfile(profileName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Profiles] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}
