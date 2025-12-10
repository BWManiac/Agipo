Credential Management System
=============================

> **Note**: This document describes features we observed in the UI. The **existence** of these features is confirmed via UI inspection, but the **implementation details** (which libraries, encryption methods, etc.) are **SPECULATED**.

---

## Overview

Asteroid.ai provides a comprehensive credential management system through **Agent Profiles** with a dedicated **Vault** section for storing sensitive authentication data.

**Confirmed**: UI features exist  
**Speculated**: Implementation details

## Security Model

**Encryption Strategy:**
- **At Rest**: All credentials encrypted in database
- **In Transit**: TLS/HTTPS encryption
- **Decryption**: Only when agent attempts to use them

**Security Notice (from UI):**
> "All credentials are encrypted in transit and at rest. Credentials are only decrypted when an agent attempts to use them. Note: agents can make mistakes and could type credentials in places you don't expect them to."

**Key Insight**: They acknowledge the risk of LLM agents making mistakes - transparency about limitations.

---

## Vault Features

### 1. Credentials Storage

**UI Evidence:**
- "Credentials" section with key icon
- Input fields for credential key-value pairs
- Multiple credentials can be stored (add/remove functionality)
- Masked display (`••••••••••••••••`)

**Stored Data:**
- Key-value pairs (e.g., "FD" → masked value)
- Likely includes usernames, passwords, API keys
- Encrypted at rest using AES-256 or similar

**Usage Pattern:**
```typescript
interface StoredCredential {
  key: string        // Display name (e.g., "FD")
  value: string      // Encrypted credential
  encrypted: true
}
```

### 2. TOTP Secrets

**UI Evidence:**
- "TOTP Secrets" section with padlock icon
- Support for Time-based One-Time Password (2FA)
- Multiple TOTP secrets can be stored

**Purpose:**
- Two-factor authentication support
- Generate time-sensitive codes for login
- Required for sites with 2FA enabled

**Implementation Likely Uses:**
- Library: `otplib` or similar
- Algorithm: TOTP (RFC 6238)
- QR code scanning or manual secret entry

**Usage Pattern:**
```typescript
import { authenticator } from 'otplib'

// When agent needs 2FA code
const totpSecret = decryptTOTPSecret(profile.totpSecrets['TOTP_DF'])
const code = authenticator.generate(totpSecret)
await page.fill('#totp-input', code)
```

### 3. Cookie Management

**UI Evidence:**
- Dedicated "Cookies" tab in profile settings
- Fields match standard browser cookie structure exactly

**Cookie Fields:**
- **Display Name**: User-friendly identifier
- **Cookie Key**: Cookie name (e.g., `session_token`)
- **Cookie Value**: The actual cookie value
- **Domain**: Cookie domain (e.g., `.example.com`)
- **Expiry**: Optional expiration date/time
- **SameSite Policy**: Dropdown (Lax/Strict/None)
- **Secure**: Checkbox (HTTPS only)
- **HttpOnly**: Checkbox

**Purpose:**
- Maintain login sessions across agent runs
- Preserve authentication state
- Avoid re-authentication for every execution

**Technical Implementation:**
```typescript
// Matches Playwright/Puppeteer cookie API
interface Cookie {
  name: string        // Cookie Key
  value: string       // Cookie Value
  domain: string      // Domain
  expires?: number    // Expiry timestamp
  httpOnly?: boolean  // HttpOnly checkbox
  secure?: boolean    // Secure checkbox
  sameSite?: 'Strict' | 'Lax' | 'None'
}

// Load cookies when agent starts
await context.addCookies(profile.cookies)

// Save cookies after successful authentication
const cookies = await context.cookies()
await saveCookiesToProfile(profileId, cookies)
```

---

## Profile Settings

### Browser Configuration

**Operating System Selection:**
- Dropdown: macOS, Windows, Linux
- Purpose: Customize user-agent and fingerprinting
- Affects browser fingerprint presented to websites

**Proxy Configuration:**
- "Proxy Type: Basic" (from UI)
- Supports IP rotation and proxy chaining
- "Sticky IP" toggle: Maintain same IP across sessions

**Stealth Features:**
- **Extra Stealth**: Enhanced bot detection evasion
- **Captcha Solver**: Automated CAPTCHA solving
- **Cache Persistence**: Keep cookies/cache across executions

---

## Credential Injection Flow

### When Agent Runs:

```typescript
async function runAgentWithProfile(agentId: string, profileId: string) {
  // 1. Load profile and decrypt credentials
  const profile = await getAgentProfile(profileId)
  const credentials = await decryptCredentials(profile.credentials)
  
  // 2. Set up browser context with profile settings
  const context = await browser.newContext({
    userAgent: getUserAgentForOS(profile.operatingSystem),
    proxy: profile.proxy,
    storageState: profile.storageState // If available
  })
  
  // 3. Load cookies if available
  if (profile.cookies && profile.cookies.length > 0) {
    await context.addCookies(profile.cookies)
  }
  
  // 4. Navigate to login page
  await page.goto('https://example.com/login')
  
  // 5. Check if already authenticated (via cookies)
  const isAuthenticated = await checkAuthenticationState(page)
  
  if (!isAuthenticated) {
    // 6. Use credentials to log in
    await page.fill('#username', credentials.username)
    await page.fill('#password', credentials.password)
    
    // 7. Handle 2FA if required
    if (credentials.totpSecret) {
      const code = generateTOTP(credentials.totpSecret)
      await page.fill('#totp', code)
    }
    
    await page.click('button[type="submit"]')
    
    // 8. Wait for authentication and save cookies
    await page.waitForURL(/dashboard/)
    const newCookies = await context.cookies()
    await saveCookiesToProfile(profileId, newCookies)
  }
  
  // 9. Continue with agent's main task
  await executeAgentTask(page, agentId)
}
```

---

## Security Considerations

### Encryption Implementation ⚠️ SPECULATED

**Confirmed**: UI states "All credentials are encrypted in transit and at rest"

**Speculated Implementation** (Example - we don't know their actual implementation):
```typescript
// This is an EXAMPLE of how they might implement encryption
// We have NO EVIDENCE of their actual implementation
import crypto from 'crypto'

const encryptionKey = process.env.ENCRYPTION_KEY
const algorithm = 'aes-256-gcm'

function encrypt(plaintext: string, key: Buffer): EncryptedData {
  // ... example implementation
}
```

**Possible Technologies** (All Speculated):
- Node.js `crypto` module (AES-256-GCM)
- AWS KMS
- HashiCorp Vault
- Other encryption services

**Note**: We know encryption happens, but implementation is unknown.

### Transit Security
- All API calls use HTTPS/TLS
- WebSocket connections use WSS (secure)
- No credentials in URL parameters or headers (unless encrypted)

---

## Key Learnings

1. **Multi-Format Support**: Credentials, TOTP, and cookies - comprehensive coverage
2. **Security Transparency**: Acknowledge LLM limitations upfront
3. **Cookie Persistence**: Critical for maintaining sessions
4. **Standard APIs**: Cookie structure matches Playwright/Puppeteer exactly
5. **Profile-Based**: Everything organized in reusable profiles
6. **Encryption Best Practices**: At rest + in transit encryption

---

## Implementation Recommendations

For similar credential management:

1. **Use Standard Cookie Format**: Match Playwright/Puppeteer API
2. **Encrypt Everything**: At rest and in transit
3. **Support Multiple Auth Types**: Username/password, TOTP, cookies
4. **Profile-Based Organization**: Group related credentials
5. **Cookie Management**: Save/restore sessions automatically
6. **Security Warnings**: Be transparent about risks

