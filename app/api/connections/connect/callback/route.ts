import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/connections/connect/callback
 * Handles OAuth callback from Composio after user authorizes an integration.
 * 
 * Composio redirects here with various query parameters depending on success/failure.
 * We validate the response and redirect the user back to the profile page.
 * 
 * Query params from Composio (may vary by integration):
 *   - code: Authorization code (on success)
 *   - state: State parameter we sent (for CSRF protection)
 *   - error: Error code (on failure)
 *   - error_description: Error details (on failure)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check for error response from OAuth provider
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (error) {
      console.error("[connections/callback] OAuth error:", error, errorDescription);
      
      // Redirect to profile with error state
      const redirectUrl = new URL("/profile", request.url);
      redirectUrl.searchParams.set("action", "integration-error");
      redirectUrl.searchParams.set("error", errorDescription || error);
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // OAuth success - Composio handles token storage on their end
    // We just need to redirect the user back to the profile page
    
    // Log success for debugging
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    console.log("[connections/callback] OAuth success:", { 
      hasCode: !!code, 
      hasState: !!state 
    });
    
    // Redirect to profile with success action to auto-open the integrations dialog
    const redirectUrl = new URL("/profile", request.url);
    redirectUrl.searchParams.set("action", "open-connections");
    
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[connections/callback] Error processing callback:", err);
    
    // Redirect to profile with generic error
    const redirectUrl = new URL("/profile", request.url);
    redirectUrl.searchParams.set("action", "integration-error");
    redirectUrl.searchParams.set("error", "Failed to process OAuth callback");
    
    return NextResponse.redirect(redirectUrl);
  }
}

