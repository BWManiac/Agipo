# Authenticated Sessions UXD

**Created:** December 2024  
**Status:** UXD Design Phase  
**Related Roadmap:** `../../01-Authenticated-Sessions.md`

---

## Overview

Authenticated Sessions enable users to maintain persistent browser profiles with saved authentication state across sessions. Users can log into services like LinkedIn once, save the browser state, and reuse that authenticated session in future automation tasks.

### Design Philosophy

- **One-time authentication** - Log in manually once, stay logged in forever
- **Profile management** - Clear visual organization of saved browser profiles
- **State preservation** - Full browser state including cookies, localStorage, tokens
- **Session continuity** - Seamless resumption of authenticated sessions
- **Security awareness** - Clear indicators of profile state and permissions

---

## UXD File Manifest

| # | File | Description | Priority |
|---|------|-------------|----------|
| 01 | `01-profile-dashboard.html` | Main profile management interface | Core |
| 02 | `02-create-profile-wizard.html` | Step-by-step profile creation | Core |
| 03 | `03-manual-login-flow.html` | Live browser view for authentication | Core |
| 04 | `04-profile-save-confirmation.html` | Confirmation after successful login | Core |
| 05 | `05-session-with-profile.html` | Starting session with saved profile | Core |
| 06 | `06-profile-selector.html` | Dropdown/modal for profile selection | Core |
| 07 | `07-profile-status-indicators.html` | Visual states (active, expired, locked) | Core |
| 08 | `08-profile-update-flow.html` | Updating existing profile state | Important |
| 09 | `09-profile-details-modal.html` | View profile metadata and history | Nice to have |
| 10 | `10-multi-profile-management.html` | Managing multiple accounts per service | Nice to have |
| 11 | `Frontend-Backend-Mapping.md` | API endpoint documentation | Core |

---

## Key Features to Demonstrate

### 1. Profile Dashboard (`01-profile-dashboard.html`)
- Grid/list view of saved profiles
- Service icons (LinkedIn, Indeed, etc.)
- Last used timestamps
- Status indicators (active, needs refresh)
- Quick actions (use, update, delete)

### 2. Create Profile Wizard (`02-create-profile-wizard.html`)
- Profile naming and description
- Service selection
- Browser settings configuration
- Persist flag explanation
- Launch browser button

### 3. Manual Login Flow (`03-manual-login-flow.html`)
- Live browser viewport
- Authentication progress indicator
- "Save Profile" button when ready
- Tips for successful authentication
- Cancel/retry options

### 4. Profile Selection (`06-profile-selector.html`)
- Dropdown in session creation
- Profile preview cards
- Filter by service
- Search profiles
- "Create new" option

### 5. Profile Status States (`07-profile-status-indicators.html`)
- Active/authenticated (green)
- Needs refresh (yellow)
- Expired/locked (red)
- In use (blue pulse)
- Syncing (spinner)

---

## Design Patterns

### Visual Language
- **Profile Cards** - Consistent card layout with service branding
- **Status Colors** - Green (active), Yellow (warning), Red (error), Blue (in-use)
- **Service Icons** - Clear service identification (LinkedIn, Indeed, etc.)
- **Progress Indicators** - Step-by-step wizards with clear progress

### Interaction Patterns
- **Quick Actions** - One-click profile usage
- **Inline Updates** - Update profiles without leaving context
- **Live Preview** - See browser state during authentication
- **Confirmation Steps** - Clear confirmation before destructive actions

### Security Indicators
- **Lock Icons** - Show secured/encrypted profiles
- **Last Activity** - Display when profile was last used
- **Session Count** - Show active sessions using profile
- **Expiry Warnings** - Alert before profiles expire

---

## Technical Integration

### Anchor Browser API
- `persist: true` flag for session creation
- Profile ID management
- Session state restoration
- Profile update endpoints

### Storage Structure
```
profiles/
├── linkedin-work-[uuid]/
│   ├── metadata.json
│   ├── anchor-profile-id
│   └── last-session.json
├── indeed-personal-[uuid]/
└── profiles-index.json
```

### State Management
- Profile list in Zustand store
- Active profile tracking
- Session-profile associations
- Real-time status updates

---

## Open Questions

1. How to handle profile expiration gracefully?
2. Should we support profile sharing between users?
3. How to indicate which agent is using which profile?
4. Maximum number of profiles per service?
5. Profile backup/export functionality?