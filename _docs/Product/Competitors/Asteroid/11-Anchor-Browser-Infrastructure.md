Anchor Browser Infrastructure (CONFIRMED) ✅
============================================

> **Status**: ✅ **CONFIRMED** - This is direct evidence from network traffic analysis.

---

## Discovery

**CONFIRMED**: Asteroid.ai uses Anchor Browser for their browser infrastructure.

**Evidence Type**: Direct network traffic analysis  
**Confidence**: **Very High** - Cannot be disputed

**Evidence** (From Network Tab):
- WebSocket connection: `wss://connect.anchorbrowser.io//vnc/?sessionId=8f33ba99-e7b8-4215-93cb-a0861f2a3468`
- Origin domain: `https://live.anchorbrowser.io`
- Protocol: **VNC** (Virtual Network Computing) for remote browser viewing

---

## What is Anchor Browser?

Anchor Browser appears to be a browser infrastructure service that provides:
- **VNC-based remote browser viewing**: Uses VNC protocol for real-time browser viewing
- **Session-based browser management**: Each browser session has a unique session ID
- **WebSocket connections**: For real-time communication and viewing
- **Live browser viewing**: Enables real-time viewing of browser sessions

---

## Architecture Discovery

### Connection Pattern

```
Asteroid.ai Platform
    ↓
WebSocket Connection
    ↓
wss://connect.anchorbrowser.io/vnc/?sessionId={uuid}
    ↓
Anchor Browser Infrastructure
    ↓
Headless Browser Instance (Playwright-controlled)
```

### VNC Protocol Usage

**VNC (Virtual Network Computing)**:
- Protocol for remote desktop/browser viewing
- Provides pixel-perfect remote viewing
- Low-latency screen sharing
- Commonly used for remote access and browser automation

**Why VNC for Browser Viewing:**
- **Real-time viewing**: Users can see exactly what the browser sees
- **Interactive control**: Potential for manual intervention
- **Low latency**: Optimized for screen sharing
- **Pixel-perfect**: Exact visual representation

---

## Evidence Analysis

### Network Request Details

**From DevTools Network Tab:**

```
Request URL: wss://connect.anchorbrowser.io//vnc/?sessionId=8f33ba99-e7b8-4215-93cb-a0861f2a3468
Request Method: GET
Status Code: 101 Switching Protocols (WebSocket upgrade)
Origin: https://live.anchorbrowser.io
```

**Headers:**
- `Connection: Upgrade`
- `Upgrade: websocket`
- `Sec-WebSocket-Key: gWl1c704/CgMNQXWXEfLMw==`
- `Sec-WebSocket-Version: 13`
- `Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits`

**Inference:**
- WebSocket connection for real-time communication
- VNC protocol embedded in WebSocket connection
- Session-based browser instances
- Real-time browser viewing capability

---

## How Anchor Browser Integrates

### Likely Integration Pattern

```typescript
// Hypothetical Asteroid.ai backend code
async function createBrowserSession(agentId: string) {
  // Create browser session via Anchor Browser API
  const session = await anchorBrowser.createSession({
    projectId: 'asteroid-agents',
    browser: 'chromium', // or firefox, webkit
    // Playwright can connect to this session
  })
  
  // Connect Playwright to Anchor Browser session
  const playwright = await chromium.connect({
    wsEndpoint: session.playwrightEndpoint // Anchor Browser provides this
  })
  
  // Use Playwright as normal
  const page = await playwright.newPage()
  await page.goto('https://example.com')
  
  // Stream VNC connection for live viewing
  const vncUrl = `wss://connect.anchorbrowser.io/vnc/?sessionId=${session.id}`
  // Send to client for real-time viewing
}
```

### Client-Side Integration

```typescript
// Asteroid.ai frontend receives VNC URL
const vncUrl = `wss://connect.anchorbrowser.io/vnc/?sessionId=${sessionId}`

// Connect to VNC stream
const vncConnection = new WebSocket(vncUrl)

// Use VNC client library to render browser view
// This provides the "live browser view" in the execution dashboard
```

---

## Anchor Browser vs Browserbase vs Own Infrastructure

### Comparison

| Feature | Anchor Browser | Browserbase | Own Infrastructure |
|---------|---------------|-------------|-------------------|
| **Protocol** | VNC over WebSocket | Custom API + Live View | Custom |
| **Viewing** | VNC-based (pixel-perfect) | iFrame Live View | Screenshots/rrweb |
| **Playwright** | ✅ Compatible | ✅ Compatible | ✅ Direct |
| **Real-time** | ✅ VNC streaming | ✅ Live View | ✅ WebSocket + rrweb |
| **Session IDs** | ✅ UUID-based | ✅ Session-based | ✅ Custom |

---

## Key Insights

### Why VNC?

1. **Pixel-Perfect Viewing**: VNC provides exact visual representation
2. **Low Latency**: Optimized protocol for screen sharing
3. **Interactive**: Potential for manual control/intervention
4. **Standard Protocol**: Well-established, battle-tested

### Architecture Benefits

1. **Separation of Concerns**:
   - Anchor Browser handles browser infrastructure
   - Asteroid handles AI/agent orchestration
   - Clear API boundary

2. **Real-Time Viewing**:
   - VNC provides immediate visual feedback
   - No need for screenshot streaming
   - Lower bandwidth than continuous screenshots

3. **Scalability**:
   - Anchor Browser manages browser instances
   - Asteroid doesn't need to manage infrastructure
   - Pay-per-use model likely

---

## Integration with Existing Stack

### How Anchor Browser Fits

```
┌─────────────────────────────────────┐
│  Asteroid.ai Platform               │
│  - Visual Builder (Astro)           │
│  - AI Reasoning Layer               │
│  - Agent Orchestration              │
│  - Profile Management               │
├─────────────────────────────────────┤
│  Asteroid WebSocket Proxy           │
│  (odyssey.asteroid.ai)              │
│  - Routes to Anchor Browser         │
├─────────────────────────────────────┤
│  Anchor Browser Infrastructure      │
│  - Browser instances (Playwright)   │
│  - VNC streaming for live view      │
│  - Session management               │
├─────────────────────────────────────┤
│  Supporting Libraries               │
│  - rrweb (for replay, not live view)│
│  - PostHog (analytics)              │
│  - otplib (TOTP)                    │
│  - CAPTCHA APIs                     │
└─────────────────────────────────────┘
```

**Note**: rrweb is likely used for:
- **Session replay** (stored recordings)
- **Analytics** (PostHog integration)
- NOT for live viewing (VNC handles that)

---

## Detection Methods (What We Found)

### Network Traffic Analysis ✅

**Method**: DevTools → Network Tab → WebSocket Filter

**Found:**
- WebSocket connection to `connect.anchorbrowser.io`
- VNC protocol in WebSocket URL
- Session ID in connection string
- Origin from `live.anchorbrowser.io`

**This is the definitive proof** - direct network evidence.

---

## Anchor Browser Features (Inferred)

Based on the connection pattern and Asteroid's usage:

1. **Session-Based Browsers**: Each browser instance has unique session ID
2. **VNC Streaming**: Real-time browser viewing via VNC protocol
3. **Playwright Integration**: Compatible with Playwright (confirmed by Asteroid's use)
4. **WebSocket API**: Real-time connection management
5. **Live Viewing**: `live.anchorbrowser.io` suggests live view capabilities

---

## Why This Matters

### Competitive Intelligence

1. **Infrastructure Choice**: Asteroid chose managed infrastructure (Anchor Browser) over building their own
2. **Viewing Technology**: VNC provides better real-time viewing than screenshot streaming
3. **Cost Structure**: Likely pay-per-use, not managing own browser infrastructure
4. **Focus**: Confirms Asteroid focuses on AI/agents, not infrastructure

### For Agipo

1. **Consider Anchor Browser**: Could be alternative to Browserbase
2. **VNC for Viewing**: Consider VNC for live browser viewing instead of screenshots
3. **Managed Infrastructure**: Validates approach of using managed browser infrastructure
4. **Hybrid Approach**: Can combine VNC (live) + rrweb (replay)

---

## Open Questions

1. **Anchor Browser's Full Feature Set**: What else does it provide beyond VNC viewing?
2. **Pricing Model**: How does pricing compare to Browserbase or self-hosted?
3. **Stealth Features**: Does Anchor Browser provide stealth/anti-detection?
4. **Proxy Support**: Does Anchor Browser manage proxies or does Asteroid?
5. **CAPTCHA Solving**: Is this handled by Anchor Browser or Asteroid?

---

## References

- **Discovered Connection**: `wss://connect.anchorbrowser.io/vnc/?sessionId=...`
- **Origin**: `https://live.anchorbrowser.io`
- **Protocol**: VNC over WebSocket
- **Evidence Source**: Chrome DevTools Network Tab during agent execution

---

## Key Takeaways

1. ✅ **Confirmed**: Asteroid.ai uses Anchor Browser (not Browserbase)
2. ✅ **VNC Protocol**: Uses VNC for real-time browser viewing
3. ✅ **Session-Based**: Each browser has unique session ID
4. ✅ **Playwright Compatible**: Works with Playwright (Asteroid's automation engine)
5. ✅ **Managed Infrastructure**: Asteroid doesn't manage browsers themselves

This discovery shows that Asteroid made a strategic choice to use managed browser infrastructure (Anchor Browser) rather than building their own, allowing them to focus on their core value proposition: AI-powered agent orchestration.

