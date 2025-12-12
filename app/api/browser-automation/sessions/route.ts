/**
 * Browser Automation Sessions API
 * GET  - List all sessions
 * POST - Create new session
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession, listSessions } from "../services/anchor-client";

// Custom URL schema that accepts empty string, null, undefined, or auto-prepends https://
const optionalUrl = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    // Auto-prepend https:// if no protocol specified
    if (typeof val === "string" && !val.match(/^https?:\/\//)) {
      return `https://${val}`;
    }
    return val;
  },
  z.string().url().optional()
);

const CreateSessionSchema = z.object({
  profileName: z.string().nullish(),
  initialUrl: optionalUrl,
  // New fields for Anchor profile persistence
  createNewProfile: z.boolean().optional(), // When true, creates a new persistent profile
  profileDisplayName: z.string().optional(), // Human-readable name for the profile
  config: z
    .object({
      timeout: z
        .object({
          maxDuration: z.number().min(1).max(60).optional(),
          idleTimeout: z.number().min(1).max(30).optional(),
        })
        .optional(),
      recording: z.boolean().optional(),
    })
    .optional(),
});

/**
 * GET /api/browser-automation/sessions
 * List all active browser sessions
 */
export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: "Failed to list sessions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/browser-automation/sessions
 * Create a new browser session
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANCHOR_API_KEY) {
      console.error("ANCHOR_API_KEY is not configured");
      return NextResponse.json(
        { error: "Anchor Browser API key not configured. Add ANCHOR_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validated = CreateSessionSchema.safeParse(body);

    if (!validated.success) {
      console.error("[Sessions] Validation error:", JSON.stringify(validated.error.format(), null, 2));
      console.error("[Sessions] Request body:", JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: "Invalid request body", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { profileName, initialUrl, createNewProfile, profileDisplayName, config } = validated.data;

    // Validate: if creating new profile, profileName is required
    if (createNewProfile && !profileName) {
      return NextResponse.json(
        { error: "Profile name is required when creating a new profile" },
        { status: 400 }
      );
    }

    const session = await createSession({
      profileName: profileName || undefined,
      initialUrl: initialUrl || undefined,
      timeout: config?.timeout,
      recording: config?.recording,
      // Only persist if creating a new profile or using an existing one
      persist: createNewProfile === true,
    });

    // If creating a new profile, register it in local storage
    if (createNewProfile && profileName) {
      const { registerAnchorProfile } = await import("../services/profile-storage");
      await registerAnchorProfile(
        profileName,
        profileDisplayName || profileName
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        profileName,
        createNewProfile,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
