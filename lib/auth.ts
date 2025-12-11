/**
 * =============================================================================
 * CUSTOM AUTH HELPER - AGIPO DEVELOPMENT WORKAROUND
 * =============================================================================
 *
 * THIS IS NOT A NEXT.JS OR CLERK BUILT-IN FEATURE.
 *
 * This is a custom helper we created to make local development easier. It wraps
 * Clerk's `auth()` function and adds support for bypassing authentication when
 * the `BYPASS_AUTH` environment variable is set to "true".
 *
 * WHY THIS EXISTS:
 * -----------------
 * During development, we often need to test API routes using curl, Postman, or
 * other HTTP clients. Without this helper, every request would require a valid
 * Clerk session token, which is cumbersome for quick iteration and testing.
 *
 * HOW IT WORKS:
 * -------------
 * 1. Set `BYPASS_AUTH=true` in your `.env.local` file
 * 2. Restart the dev server (env vars are loaded at startup)
 * 3. All API routes using `getAuthUser()` will return a mock user ("dev-user")
 * 4. You can now curl any API route without authentication
 *
 * IMPORTANT - PRODUCTION SAFETY:
 * ------------------------------
 * - NEVER set `BYPASS_AUTH=true` in production environments
 * - Production deployments should NOT have this env var defined
 * - The proxy.ts (Next.js middleware) also has a BYPASS_AUTH check that works
 *   in tandem with this helper
 *
 * CAN THIS BE DELETED?
 * --------------------
 * YES. This file is entirely optional and can be safely deleted if:
 * - You want to enforce authentication in all environments
 * - You prefer using Clerk's test tokens for local development
 * - You have another auth bypass strategy
 *
 * To remove this workaround:
 * 1. Delete this file (lib/auth.ts)
 * 2. In all API routes listed below, replace:
 *      import { getAuthUser } from "@/lib/auth";
 *    with:
 *      import { auth } from "@clerk/nextjs/server";
 * 3. Replace all `getAuthUser()` calls with `auth()`
 * 4. Remove `BYPASS_AUTH` from proxy.ts if desired
 *
 * =============================================================================
 * API ROUTES USING THIS HELPER (17 total):
 * =============================================================================
 *
 * WORKFORCE DOMAIN:
 * - app/api/workforce/route.ts                                    GET
 * - app/api/workforce/create/route.ts                             POST
 * - app/api/workforce/[agentId]/chat/route.ts                     POST
 * - app/api/workforce/[agentId]/knowledge/route.ts                GET, DELETE
 * - app/api/workforce/[agentId]/threads/route.ts                  GET, POST
 * - app/api/workforce/[agentId]/threads/[threadId]/route.ts       GET, PATCH, DELETE
 * - app/api/workforce/[agentId]/tools/connection/available/route.ts  GET
 *
 * CONNECTIONS DOMAIN:
 * - app/api/connections/route.ts                                  GET
 * - app/api/connections/connect/route.ts                          POST
 * - app/api/connections/disconnect/route.ts                       DELETE
 *
 * RECORDS DOMAIN:
 * - app/api/records/[tableId]/chat/route.ts                       POST
 * - app/api/records/[tableId]/threads/route.ts                    GET, POST
 * - app/api/records/[tableId]/threads/[threadId]/route.ts         GET, PATCH, DELETE
 * - app/api/records/[tableId]/access/route.ts                     GET
 * - app/api/records/[tableId]/activity/route.ts                   GET
 * - app/api/records/[tableId]/access/agents/route.ts              POST
 * - app/api/records/[tableId]/access/agents/[agentId]/route.ts    PATCH, DELETE
 *
 * =============================================================================
 */

import { auth } from "@clerk/nextjs/server";

/**
 * Get authenticated user, with support for bypassing auth in development.
 *
 * When BYPASS_AUTH=true in .env.local, returns a mock dev user.
 * Otherwise, delegates to Clerk's auth().
 *
 * @returns Promise<{ userId: string | null }> - The authenticated user ID
 *
 * @example
 * // In an API route:
 * const { userId } = await getAuthUser();
 * if (!userId) {
 *   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
 * }
 */
export async function getAuthUser() {
  if (process.env.BYPASS_AUTH === "true") {
    return { userId: "dev-user" };
  }
  return auth();
}
