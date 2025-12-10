Stealth & Anti-Detection Features
===================================

> **Note**: This document describes features observed in the UI. The **existence** of these features is confirmed, but the **implementation details** (which libraries, specific techniques) are **SPECULATED**.

---

## Overview

Asteroid.ai includes several features designed to avoid bot detection and maintain reliable browser automation at scale.

**Confirmed**: UI features exist (toggles, settings)  
**Speculated**: Implementation methods

## Features Identified

### 1. Extra Stealth

**UI Evidence:**
- Toggle: "Enable for even greater bot detection evasion"
- Part of profile configuration

**What it likely does:**
- Advanced fingerprinting evasion
- Override browser automation indicators
- Customize browser properties

**Implementation Pattern:**
```typescript
// Custom stealth scripts injected into browser
await page.addInitScript(() => {
  // Remove webdriver flag
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  })
  
  // Override plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5]
  })
  
  // Custom user agent
  Object.defineProperty(navigator, 'userAgent', {
    get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...'
  })
  
  // Override permissions
  const originalQuery = window.navigator.permissions.query
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
      Promise.resolve({ state: Notification.permission }) :
      originalQuery(parameters)
  )
})
```

**Libraries Possibly Used:**
- `puppeteer-extra-plugin-stealth` (if using Puppeteer)
- Custom scripts (if using Playwright)

---

### 2. Proxy Support

**UI Evidence:**
- "Proxy Type: Basic" dropdown
- "Sticky IP" toggle: "Maintain the same IP address across sessions"

**Purpose:**
- IP rotation for rate limiting avoidance
- Geographic diversity
- Avoid IP-based blocking

**Implementation:**
```typescript
// Playwright proxy configuration
const context = await browser.newContext({
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: proxyConfig.username,
    password: proxyConfig.password
  }
})

// For sticky IP, reuse same proxy for profile
const profileProxy = await getProxyForProfile(profileId)
// Use same proxy across all sessions for this profile
```

**Proxy Types Likely Supported:**
- HTTP/HTTPS proxies
- SOCKS5 proxies
- Rotating proxy services (Bright Data, Oxylabs, etc.)

---

### 3. Operating System Selection

**UI Evidence:**
- Dropdown: macOS, Windows, Linux
- Affects fingerprinting

**Purpose:**
- Customize user-agent strings
- Match OS-specific browser fingerprints
- Platform-specific behavior patterns

**Implementation:**
```typescript
const userAgents = {
  'macOS': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
  'Windows': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...'
}

const context = await browser.newContext({
  userAgent: userAgents[selectedOS],
  locale: 'en-US',
  timezoneId: 'America/New_York',
  viewport: { width: 1920, height: 1080 }
})
```

**Fingerprinting Properties:**
- User-agent string
- Platform detection (`navigator.platform`)
- Screen resolution
- Timezone
- Language preferences

---

### 4. CAPTCHA Solver

**UI Evidence:**
- Toggle: "Automatically solve captchas during browsing"
- Feature: "Enhanced stealth with IP proxies and automated CAPTCHA handling"

**Purpose:**
- Handle reCAPTCHA, hCaptcha, etc.
- Automatic solving without human intervention
- Seamless automation flow

**Implementation:**
```typescript
// Detect CAPTCHA presence
async function detectAndSolveCaptcha(page: Page) {
  // Check for common CAPTCHA indicators
  const captchaPresent = await page.evaluate(() => {
    return !!(
      document.querySelector('[data-sitekey]') || // reCAPTCHA
      document.querySelector('.hcaptcha') || // hCaptcha
      document.querySelector('#captcha') // Generic
    )
  })
  
  if (!captchaPresent) return
  
  // Extract CAPTCHA image/iframe
  const captchaImage = await page.screenshot({
    selector: '#captcha-container'
  })
  
  // Send to solving service
  const solution = await solveCaptchaWithService(captchaImage)
  
  // Input solution
  await page.fill('#captcha-input', solution)
  await page.click('button[type="submit"]')
}

// Integration with CAPTCHA solving services
async function solveCaptchaWithService(image: Buffer): Promise<string> {
  // 2Captcha API
  const taskId = await twoCaptcha.createTask({
    method: 'recaptcha2',
    googlekey: siteKey,
    pageurl: pageUrl
  })
  
  // Poll for solution
  let solution = null
  while (!solution) {
    await sleep(5000)
    solution = await twoCaptcha.getResult(taskId)
  }
  
  return solution
}
```

**CAPTCHA Services Likely Used:**
- **2Captcha**: Popular, supports many types
- **AntiCaptcha**: Alternative service
- **Capsolver**: Modern API
- **DeathByCaptcha**: Legacy option

**Cost Consideration:**
- ~$2-3 per 1000 CAPTCHAs
- Can add up quickly at scale
- Usually passed through to customer

---

### 5. Cache Persistence

**UI Evidence:**
- Toggle: "Keep cookies and cache across executions (useful for staying signed into sites)"

**Purpose:**
- Maintain login sessions
- Preserve browser state
- Faster subsequent loads (cached resources)

**Implementation:**
```typescript
// Playwright persistent context
const context = await browser.newContext({
  storageState: `profiles/${profileId}/storage-state.json`
})

// After authentication, save state
await context.storageState({ path: `profiles/${profileId}/storage-state.json` })
```

**What gets persisted:**
- Cookies
- LocalStorage
- SessionStorage
- IndexedDB (optional)

---

## Detection Vectors They're Avoiding

### 1. WebDriver Flag
```typescript
// Detection: navigator.webdriver === true
// Solution: Override to undefined
Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
```

### 2. Chrome Automation
```typescript
// Detection: window.chrome.runtime exists in automation
// Solution: Remove automation extensions
await context.addInitScript(() => {
  delete window.chrome
})
```

### 3. Plugin Detection
```typescript
// Detection: navigator.plugins.length === 0
// Solution: Fake plugins array
Object.defineProperty(navigator, 'plugins', {
  get: () => [
    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
    // ... more plugins
  ]
})
```

### 4. Canvas Fingerprinting
```typescript
// Detection: Canvas rendering differs in automation
// Solution: Inject noise or use consistent rendering
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL
HTMLCanvasElement.prototype.toDataURL = function(...args) {
  // Add subtle noise or use consistent seed
  return originalToDataURL.apply(this, args)
}
```

### 5. WebGL Fingerprinting
```typescript
// Detection: WebGL parameters differ
// Solution: Override WebGL parameters
const getParameter = WebGLRenderingContext.prototype.getParameter
WebGLRenderingContext.prototype.getParameter = function(parameter) {
  // Return consistent values for fingerprinting parameters
  if (parameter === 37445) return 'Intel Inc.' // UNMASKED_VENDOR_WEBGL
  return getParameter.call(this, parameter)
}
```

---

## Complete Stealth Configuration

```typescript
async function createStealthContext(browser: Browser, profile: Profile) {
  const context = await browser.newContext({
    // User agent based on OS selection
    userAgent: getUserAgentForOS(profile.operatingSystem),
    
    // Proxy configuration
    proxy: profile.proxy ? {
      server: profile.proxy.server,
      username: profile.proxy.username,
      password: profile.proxy.password
    } : undefined,
    
    // Viewport (consistent)
    viewport: { width: 1920, height: 1080 },
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Storage state (for persistence)
    storageState: profile.storageStatePath,
    
    // Extra headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })
  
  // Inject stealth scripts if enabled
  if (profile.extraStealth) {
    await context.addInitScript(getStealthScript())
  }
  
  return context
}
```

---

## Key Learnings

1. **Multiple Layers**: Stealth requires addressing many detection vectors
2. **Profile-Based**: Different profiles can have different stealth levels
3. **Proxy Critical**: IP rotation essential for scale
4. **CAPTCHA Integration**: Must handle CAPTCHAs automatically
5. **Persistence Matters**: Cache/cookies reduce detection signals
6. **OS Selection**: Fingerprinting includes OS-specific properties

---

## Implementation Recommendations

For similar stealth capabilities:

1. **Use Existing Libraries**: `puppeteer-extra-plugin-stealth` or build custom
2. **Profile-Based Config**: Allow users to customize stealth level
3. **Proxy Integration**: Essential for production use
4. **CAPTCHA Services**: Integrate with 2Captcha/AntiCaptcha
5. **Test Detection**: Regularly test against bot detection services
6. **Balance**: Too much stealth can be suspicious - find the right level

