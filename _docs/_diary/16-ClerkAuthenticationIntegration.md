# Diary Entry 16: Clerk Authentication Integration

**Date:** December 3, 2025  
**Topic:** Implementing User Authentication with Clerk  
**Status:** Complete

---

## 1. Executive Summary

We integrated **Clerk** as Agipo's authentication provider, replacing all hardcoded `"agipo_test_user"` references with real authenticated user IDs. This entry documents:

1. **The problem:** MVP used a hardcoded user ID, meaning all users shared the same integrations and data.

2. **The solution:** Clerk provides OAuth/password authentication with minimal configuration. User IDs flow through to Composio, isolating each user's connected accounts.

3. **The implementation:** Created middleware, wrapped the app, updated TopNav, and modified API routes to extract userId from Clerk sessions.

4. **The result:** Each user now has their own isolated integrations. Connections created while signed in are tied to that user's Clerk ID.

**Key Insight:** For Next.js 16+, Clerk uses `proxy.ts` (not `middleware.ts`). This is a recent change in Clerk's SDK that aligns with Next.js's evolving middleware architecture.

---

## 2. Philosophy: Why Auth Now?

### 2.1 The Multi-Tenancy Problem

Before auth, Agipo had a fundamental flaw:

```
User A connects Gmail → stored as "agipo_test_user"
User B visits Agipo → sees User A's Gmail connection
User B connects Slack → stored as "agipo_test_user"
User A refreshes → sees User B's Slack connection
```

Every user shared the same identity. This was acceptable for solo development but made the product unusable for real testing.

### 2.2 Why Clerk?

| Option | Pros | Cons |
|--------|------|------|
| **Clerk** | Instant setup, hosted UI, Next.js SDK | Vendor lock-in |
| **NextAuth** | Open source, flexible | More configuration |
| **Auth0** | Enterprise features | Complex, expensive |
| **Custom** | Full control | Months of work |

**Decision:** Clerk wins for MVP velocity. We can migrate later if needed.

### 2.3 The Identity Chain

With Clerk, user identity flows through the entire stack:

```
Clerk Sign-In → Session Cookie → API Route → auth() → userId → Composio
```

When a user connects Gmail, Composio stores:
- `userId`: `user_36LgBvTVG3z5niNeN...` (Clerk ID)
- `authConfigId`: `ac_Mfm33WooiB-E` (Gmail OAuth config)
- `status`: `ACTIVE`

That connection only appears for that user.

---

## 3. The Problem: Hardcoded User ID

### 3.1 Where It Appeared

```typescript
// app/api/integrations/list/route.ts
const effectiveUserId = userId || "agipo_test_user";  // ❌

// app/api/integrations/connect/route.ts
const effectiveUserId = userId || "agipo_test_user";  // ❌

// app/(pages)/profile/hooks/useIntegrations.ts
fetch("/api/integrations/list?userId=agipo_test_user")  // ❌
```

### 3.2 Impact

| Issue | Severity | Description |
|-------|----------|-------------|
| No user isolation | Critical | All connections shared |
| No access control | Critical | Anyone could access any data |
| No audit trail | High | Can't track who did what |
| Fake TopNav | Low | Showed "John Doe" for everyone |

### 3.3 Composio Dashboard Evidence

Before auth, all connections showed `agipo_test_user`:

```
ACCOUNT ID          USER ID              STATUS
ca_gEp_K0DWtInD     agipo_test_user      ACTIVE
ca_LG68YGkYopq3     pg-test-54e5ef13...  EXPIRED
```

After auth, new connections show real Clerk IDs:

```
ACCOUNT ID          USER ID                      STATUS
ca_S2dWJsVSnB7i     user_36LgBvTVG3z5niNeN...   ACTIVE  ← Real user!
ca_gEp_K0DWtInD     agipo_test_user              ACTIVE
```

---

## 4. File Impact Analysis

### 4.1 New Files

| File | Lines | Description |
|------|-------|-------------|
| `proxy.ts` | 22 | Clerk middleware with route protection |

### 4.2 Modified Files

| File | Changes | Description |
|------|---------|-------------|
| `app/layout.tsx` | +3 lines | Added `<ClerkProvider>` wrapper |
| `components/layout/TopNav.tsx` | Rewritten | Clerk components replace mock user |
| `app/api/integrations/list/route.ts` | +8, -10 | Uses `auth()`, returns 401 if no session |
| `app/api/integrations/connect/route.ts` | +8, -8 | Uses `auth()`, returns 401 if no session |
| `app/(pages)/profile/hooks/useIntegrations.ts` | -1 line | Removed `userId` query param |

### 4.3 Dependencies Added

```json
{
  "@clerk/nextjs": "^latest"
}
```

---

## 5. Implementation Details

### 5.1 Middleware: `proxy.ts`

For Next.js 16+, Clerk requires the file be named `proxy.ts` (not `middleware.ts`):

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",              // Landing page
  "/sign-in(.*)",   // Clerk sign-in
  "/sign-up(.*)",   // Clerk sign-up
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();  // Redirect to sign-in if not authenticated
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Key points:**
- `createRouteMatcher` defines which routes are public
- `auth.protect()` redirects unauthenticated users to sign-in
- The `matcher` config ensures middleware runs on all routes except static assets

### 5.2 Layout: `<ClerkProvider>`

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ReactQueryProvider>
            {children}
          </ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

`<ClerkProvider>` must wrap the entire app for Clerk hooks and components to work.

### 5.3 TopNav: Authentication UI

**Before:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>  {/* Fake user */}
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Log out</DropdownMenuItem>  {/* Did nothing */}
  </DropdownMenuContent>
</DropdownMenu>
```

**After:**
```typescript
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

// When signed out:
<SignedOut>
  <SignInButton mode="modal">
    <Button variant="default" size="sm">Sign In</Button>
  </SignInButton>
</SignedOut>

// When signed in:
<SignedIn>
  <Button variant="ghost" size="icon">
    <Bell className="h-5 w-5" />
  </Button>
  <Link href="/profile">
    <Button variant="ghost" size="icon">
      <User className="h-5 w-5" />
    </Button>
  </Link>
  <UserButton afterSignOutUrl="/" />
</SignedIn>
```

**UI elements when signed in:**
- Bell icon (notifications placeholder)
- User icon → links to `/profile` page (integrations live here)
- Clerk `<UserButton>` → avatar with account dropdown and sign-out

### 5.4 API Routes: Extracting User ID

**Before:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const effectiveUserId = userId || "agipo_test_user";
  // ...
}
```

**After:**
```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // userId is now the real Clerk user ID
  const connections = await listConnections(userId);
  // ...
}
```

**Key changes:**
- No more query parameter for userId
- `auth()` extracts userId from session cookie
- Returns 401 if no valid session
- POST routes no longer accept userId in request body

### 5.5 Frontend Hook: No More Hardcoded ID

**Before:**
```typescript
fetch("/api/integrations/list?userId=agipo_test_user")
```

**After:**
```typescript
fetch("/api/integrations/list")  // Server extracts userId from session
```

---

## 6. Protected Routes

### 6.1 Route Protection Matrix

| Route | Protection | Behavior |
|-------|------------|----------|
| `/` | Public | Landing page (if exists) |
| `/sign-in`, `/sign-up` | Public | Clerk-managed |
| `/home` | Protected | Redirect to sign-in |
| `/workforce` | Protected | Redirect to sign-in |
| `/records` | Protected | Redirect to sign-in |
| `/tools` | Protected | Redirect to sign-in |
| `/marketplace` | Protected | Redirect to sign-in |
| `/profile` | Protected | Redirect to sign-in |
| `/api/integrations/*` | Protected | Returns 401 |

### 6.2 How Protection Works

```
1. User visits /home (unauthenticated)
2. proxy.ts intercepts request
3. isPublicRoute("/home") → false
4. auth.protect() → no session found
5. Clerk redirects to sign-in modal
6. User signs in
7. Clerk creates session cookie
8. Redirect back to /home
9. proxy.ts intercepts → session valid → continue
10. /home renders
```

---

## 7. User Identity in Composio

### 7.1 ID Format

Clerk user IDs look like: `user_36LgBvTVG3z5niNeN8Ao1XyZabc`

These are passed directly to Composio:
```typescript
await client.connectedAccounts.initiate(
  "user_36LgBvTVG3z5niNeN8Ao1XyZabc",  // Clerk userId
  "ac_Mfm33WooiB-E",                     // Auth config ID
  { callbackUrl: "..." }
);
```

### 7.2 Composio Dashboard View

After connecting Google Calendar while signed in as a real user:

| Account ID | User ID | Created | Status |
|------------|---------|---------|--------|
| ca_S2dWJsVSnB7i | user_36LgBvTVG3z5niNeN... | Dec 3, 2025 | ACTIVE |
| ca_gEp_K0DWtInD | agipo_test_user | Dec 3, 2025 | ACTIVE |

The new connection is tied to the real user. Old test connections remain but are isolated.

### 7.3 Data Isolation

```typescript
// User A signs in (userId: user_abc123)
GET /api/integrations/list
→ Returns only connections where userId = user_abc123

// User B signs in (userId: user_xyz789)
GET /api/integrations/list
→ Returns only connections where userId = user_xyz789
```

Each user sees only their own integrations.

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                         │
│                                                                             │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────┐   │
│  │ Sign In     │     │                   TopNav                         │   │
│  │ Button      │     │  [Bell] [Profile → /profile] [UserButton]       │   │
│  └──────┬──────┘     └─────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                          │
│  │ Clerk Modal  │ ← OAuth (Google, GitHub) or Email/Password               │
│  └──────┬───────┘                                                          │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐                                                          │
│  │Session Cookie│ ← __clerk_session (httpOnly, secure)                     │
│  └──────────────┘                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              proxy.ts                                        │
│                                                                             │
│  clerkMiddleware() → isPublicRoute? → auth.protect()                        │
│                                                                             │
│  Public: /, /sign-in, /sign-up                                              │
│  Protected: Everything else                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES                                      │
│                                                                             │
│  const { userId } = await auth();                                           │
│                                                                             │
│  if (!userId) return 401;                                                   │
│                                                                             │
│  // userId = "user_36LgBvTVG3z5niNeN..."                                    │
│  const connections = await listConnections(userId);                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPOSIO                                        │
│                                                                             │
│  Connected Accounts filtered by userId                                       │
│  ┌────────────────────────────────────────────┐                             │
│  │ user_36LgBvTVG3z5niNeN... → [Gmail, Slack] │                             │
│  │ user_xyz789...            → [GitHub]       │                             │
│  │ agipo_test_user           → [Calendar]     │  ← Legacy test data         │
│  └────────────────────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Environment Variables

### 9.1 Required Variables

Add to `.env.local` (already gitignored):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 9.2 Optional Variables

```bash
# Customize redirect behavior
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/home
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/home
```

---

## 10. Testing & Verification

### 10.1 Acceptance Criteria

| # | Criteria | Status |
|---|----------|--------|
| 1 | `proxy.ts` exists with `clerkMiddleware()` | ✅ |
| 2 | `app/layout.tsx` wraps with `<ClerkProvider>` | ✅ |
| 3 | TopNav shows `<SignInButton>` when signed out | ✅ |
| 4 | TopNav shows `<UserButton>` when signed in | ✅ |
| 5 | Protected routes redirect when unauthenticated | ✅ |
| 6 | `GET /api/integrations/list` returns 401 without session | ✅ |
| 7 | `POST /api/integrations/connect` returns 401 without session | ✅ |
| 8 | Integration list uses real Clerk userId | ✅ |
| 9 | OAuth flow ties connection to real user | ✅ |
| 10 | Sign-out clears session | ✅ |

### 10.2 Manual Test Flow

1. Visit `/home` while signed out → redirected to sign-in
2. Sign in with email or OAuth
3. Navigate to `/profile` → see integrations section
4. Click "Manage Integrations" → dialog opens
5. Connect Gmail → OAuth flow → returns to app
6. Check Composio dashboard → connection shows Clerk userId
7. Sign out → session cleared
8. Sign in as different user → Gmail connection not visible

---

## 11. Migration Notes

### 11.1 Legacy Connections

Connections created before auth (with `agipo_test_user`) still exist in Composio but are isolated:
- They won't appear for any real user
- They can be deleted manually from Composio dashboard
- No migration script needed

### 11.2 Breaking Changes

| Change | Impact | Mitigation |
|--------|--------|------------|
| API routes require auth | Unauthenticated calls fail | Frontend was already sending cookies |
| No userId in request body | POST body shape changed | Frontend updated simultaneously |
| No userId in query params | GET calls simpler | Frontend updated simultaneously |

---

## 12. Known Limitations

| Limitation | Severity | Future Fix |
|------------|----------|------------|
| No org/team support | Low | Clerk supports organizations |
| No role-based access | Low | Add when needed |
| No custom sign-in page | Low | Using Clerk modal for MVP |
| Session expiry handling | Low | Clerk auto-refreshes |

---

## 13. Lessons Learned

### 13.1 Next.js Version Matters

Clerk's file naming changed between Next.js versions:
- Next.js ≤14: `middleware.ts`
- Next.js ≥15: `proxy.ts`

We're on Next.js **16.0.1**, so we use `proxy.ts`. This wasn't obvious from older tutorials.

**Lesson:** Always check SDK docs for your exact framework version.

### 13.2 Clerk Simplifies Everything

What would have taken days with custom auth took ~30 minutes:
- Sign-up/sign-in flows
- Session management
- Token refresh
- OAuth providers
- Account management UI

**Lesson:** For MVP, use managed services. Optimize later.

### 13.3 User ID Propagation is Key

The hardest part was ensuring userId flows through every layer:
- Frontend (cookie) → Middleware (validation) → API (extraction) → Service (Composio)

One broken link and auth fails silently or returns wrong data.

**Lesson:** Trace the identity chain end-to-end during implementation.

---

## 14. References

### 14.1 Internal Files

| File | Description |
|------|-------------|
| `proxy.ts` | Clerk middleware |
| `app/layout.tsx` | ClerkProvider wrapper |
| `components/layout/TopNav.tsx` | Auth UI components |
| `app/api/integrations/list/route.ts` | Uses auth() |
| `app/api/integrations/connect/route.ts` | Uses auth() |

### 14.2 External Links

| Resource | URL |
|----------|-----|
| Clerk Next.js Quickstart | https://clerk.com/docs/quickstarts/nextjs |
| Clerk Middleware Reference | https://clerk.com/docs/reference/nextjs/clerk-middleware |
| Clerk Components | https://clerk.com/docs/components/overview |

### 14.3 Related Diary Entries

- Entry 15: Composio Integrations Platform (the system we just secured)
- Entry 14: Workforce OS (agent modal, also now protected)

---

## 15. Summary

We successfully integrated Clerk authentication into Agipo, solving the critical issue of shared user identity.

**What changed:**
- Created `proxy.ts` with route protection
- Wrapped app with `<ClerkProvider>`
- Replaced mock TopNav user with real Clerk components
- API routes now extract userId from session
- Frontend no longer sends userId (server handles it)

**Result:**
- Each user has isolated integrations
- Protected routes require sign-in
- Composio connections tied to real Clerk user IDs
- Sign-in/sign-out works correctly

**Files Created:** 1 (`proxy.ts`)  
**Files Modified:** 5  
**Dependencies Added:** 1 (`@clerk/nextjs`)  
**Implementation Time:** ~30 minutes

The integrations platform is now properly secured. Users can only see and manage their own connected accounts.

---

## 16. Next Steps

| Task | Priority | Notes |
|------|----------|-------|
| Add connection deletion | Medium | Users should be able to disconnect |
| Org/team support | Low | Clerk supports this natively |
| Role-based access | Low | Admin vs member permissions |
| Custom sign-in page | Low | For branded experience |

