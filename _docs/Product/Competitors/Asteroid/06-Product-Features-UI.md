Product Features & UI Analysis
===============================

> **Note**: This document describes **UI features** we observed. These are **CONFIRMED** features (we saw them in the UI), but does not confirm the underlying implementation technologies.

---

## Overview

Analysis of Asteroid.ai's product features and UI patterns based on screenshots and interface exploration.

**Status**: All features described here are **CONFIRMED** via UI inspection. Implementation details are **SPECULATED**.

## Agent Profile System

### Profile Creation Flow

**Three-Tab Interface:**
1. **Profile Settings**: Browser configuration
2. **Vault**: Credential and secret storage
3. **Cookies**: Cookie management

### Profile Settings Tab

**Configuration Options:**

1. **Profile Name**
   - Text input with placeholder
   - Unique identifier for profile

2. **Operating System**
   - Dropdown with icons
   - Options: macOS, Windows, Linux
   - Affects fingerprinting and user-agent

3. **Proxy Type**
   - Dropdown (currently "Basic")
   - Supports proxy configuration

4. **Country**
   - Dropdown with flag icons
   - Geographic selection (e.g., United States)
   - Likely affects proxy location

**Toggle Switches:**

1. **Captcha Solver** (ON by default)
   - Description: "Automatically solve captchas during browsing"
   - Purple when enabled

2. **Sticky IP** (ON by default)
   - Description: "Maintain the same IP address across sessions"
   - Important for maintaining session consistency

3. **Extra Stealth** (ON by default)
   - Description: "Enable for even greater bot detection evasion"
   - Advanced fingerprinting evasion

4. **Cache Persistence** (ON by default)
   - Description: "Keep cookies and cache across executions (useful for staying signed into sites)"
   - Critical for session management

---

## Vault Tab (Credential Management)

### Credentials Section

**UI Elements:**
- Shield/key icon
- Status: "No credentials stored yet" or list of stored credentials
- Masked display: `••••••••••••••••`
- "+ ADD" button for adding credentials

**Fields:**
- Key-value pairs (e.g., "FD" → masked value)
- Display name for each credential

**Security Notice:**
> "All credentials are encrypted in transit and at rest. Credentials are only decrypted when an agent attempts to use them. Note: agents can make mistakes and could type credentials in places you don't expect them to."

**Key Insight**: They acknowledge LLM limitations upfront - transparency about risks.

### TOTP Secrets Section

**UI Elements:**
- Green circular icon (typically for 2FA)
- Status: "No TOTP secrets stored yet" or list
- "+ ADD" button

**Purpose:**
- Store Time-based One-Time Password secrets
- Enable 2FA support for agents
- Generate codes when needed

**Field Example:**
- Label: "TOTP_DF" (user-defined)
- Value: Masked secret

---

## Cookies Tab

### Cookie Management Interface

**Description:**
> "Manage cookies that will be available to agents during execution. Cookies are set in the browser context and can be used for authentication or maintaining session state across agent actions."

### Cookie Fields

**Required Fields:**
1. **Display Name** (required, marked with *)
   - Placeholder: "e.g., Auth Token"
   - User-friendly identifier

2. **Cookie Key** (required)
   - Placeholder: "e.g., session_token"
   - Actual cookie name

3. **Cookie Value** (required)
   - Placeholder: "Cookie value..."
   - The cookie value

4. **Domain** (required)
   - Placeholder: "e.g., .example.com"
   - Cookie domain

**Optional Fields:**
5. **Expiry**
   - Placeholder: "mm/dd/yyyy, --:-- --"
   - Optional expiration date/time

**Configuration Options:**

6. **SameSite Policy**
   - Dropdown: "Lax" (default), "Strict", "None"
   - Browser security policy

7. **Secure (HTTPS only)**
   - Checkbox
   - Restricts cookie to HTTPS

8. **HttpOnly**
   - Checkbox
   - Prevents JavaScript access

### Cookie Actions

- **SAVE COOKIE**: Purple button with cookie icon
- **CANCEL**: Text link with X icon
- Multiple cookies can be added (list management)

---

## Run Agent Modal

### Agent Execution Interface

**Modal Title:** "Run Agent"
**Subtitle:** "Run the agent with the selected profile and variables."

### Profile Selection

**Section:** "Create Agent Profile (Optional)"

**Questions/Options:**
1. **Cookie Persistence**
   - Icon: Cookie
   - Text: "Do you need to run the agent with the same cookies?"
   - Description: "Maintain login sessions and user preferences across runs."

2. **Credential Storage**
   - Icon: Key
   - Text: "Do you want to store credentials and give Agent access to them?"
   - Description: "Store secrets with agent profiles."

3. **Proxy/CAPTCHA**
   - Icon: Shield
   - Text: "Do you need proxies or CAPTCHA solvers?"
   - Description: "Enhanced stealth with IP proxies and automated CAPTCHA handling."

**Profile Dropdown:**
- Current: "No agent profile"
- "+" button to create new profile

### File Upload

**Section:** "Files (Optional)"
- Paperclip icon
- Dashed upload area
- Text: "Drop files here or click to browse"
- "Maximum file size: 20MB"
- "SELECT FILES" button

**Purpose:**
- Upload input files for agent execution
- Documents, images, data files
- Processed during agent run

### Metadata

**Section:** "Metadata (Optional)"
- Tag icon
- Status: "No metadata added. Click Add to add key-value pairs."
- "ADD" button

**Purpose:**
- Key-value metadata for agent execution
- Configuration parameters
- Runtime variables

### Action Buttons

- **CANCEL**: Grey button
- **RUN**: Purple button (primary action)

---

## Execution Dashboard

### Execution List View

**Columns:**
- **AI Label**: Automated classification
- **Human Labels**: User-provided labels
- **Start Time**: Execution timestamp
- **Duration**: How long execution took
- **Version**: Agent version
- **Agent Profile**: Which profile was used

**Status Indicators:**
- "completed" (purple tag)
- "success" (green tag)
- "+" icon (likely add/view actions)
- Timestamp: "Dec 9, 8:46 PM"
- Duration: "1m 55s"
- Version: "v1"

**Inference:**
- Execution history tracking
- Version control for agents
- Labeling system (AI + human)
- Performance metrics

---

## UI Patterns & Design

### Color Scheme
- **Primary Purple**: Main actions, active states
- **Green**: Success indicators
- **Grey**: Neutral/secondary actions
- **Icons**: Consistent iconography throughout

### Modal Pattern
- Large modals for complex workflows
- Multi-tab interfaces for organization
- Clear primary/secondary actions
- Consistent cancel/confirm pattern

### Form Design
- Required fields marked with *
- Placeholders provide guidance
- Toggle switches for boolean options
- Dropdowns with icons for visual clarity

### Security Indicators
- Padlock icons for secure sections
- Masked values for sensitive data
- Security disclaimers in Vault
- Clear encryption messaging

---

## Key Insights from UI

1. **Profile-Centric**: Everything organized around reusable profiles
2. **Security First**: Clear encryption messaging, masked values
3. **User-Friendly**: Simple questions guide profile creation
4. **Comprehensive**: Covers credentials, cookies, proxies, CAPTCHA
5. **Transparency**: Acknowledges LLM limitations in security notice
6. **Flexibility**: Optional features (files, metadata) for advanced use

---

## Feature Completeness

### Authentication
- ✅ Username/password storage
- ✅ TOTP/2FA support
- ✅ Cookie management
- ✅ Session persistence

### Stealth
- ✅ Proxy support
- ✅ CAPTCHA solving
- ✅ Fingerprinting evasion
- ✅ OS selection

### Execution
- ✅ File uploads
- ✅ Metadata/configuration
- ✅ Version tracking
- ✅ Execution history

### Observability
- ✅ Execution dashboard
- ✅ Duration tracking
- ✅ Status indicators
- ✅ Labeling system

---

## Gaps & Opportunities

### Potential Missing Features
- OAuth token management (not visible in UI)
- Session recording/replay controls (might be elsewhere)
- Advanced workflow configuration (not in profile UI)
- Team/sharing features (not visible)

### Opportunities for Differentiation
- Better OAuth/OIDC support
- More sophisticated credential rotation
- Built-in workflow builder (Astro exists but not shown)
- Collaboration features
- Analytics dashboard

---

## Design Recommendations

Based on Asteroid.ai's UI patterns:

1. **Profile-Based Organization**: Group related settings
2. **Security Transparency**: Clear encryption messaging
3. **Progressive Disclosure**: Optional advanced features
4. **Visual Indicators**: Icons for quick recognition
5. **Consistent Patterns**: Reusable modal/form components
6. **User Guidance**: Questions and descriptions guide usage

