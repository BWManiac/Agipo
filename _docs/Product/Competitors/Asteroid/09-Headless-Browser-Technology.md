Headless Browser Technology
============================

> **Note**: This document contains **SPECULATION** based on inferred patterns. We have **NO DIRECT EVIDENCE** of whether they use headless or headed browsers, or which browser engine.

---

## What We KNOW ✅

1. **Playwright** is used (confirmed via UI)
2. **Anchor Browser** manages the browser infrastructure (confirmed via network traffic)
3. **VNC protocol** is used for live viewing (confirmed via network traffic)

---

## What We DON'T KNOW ⚠️

1. **Headless vs Headed**: No evidence of which mode they use
2. **Browser Engine**: No evidence of Chromium vs Firefox vs WebKit
3. **How VNC Works**: Anchor Browser could be providing headless browsers with VNC streaming, or headed browsers with VNC access

---

## SPECULATION: Browser Engine Options

Since Playwright is confirmed, Playwright supports three browser engines:

## Playwright's Browser Engines

Playwright supports three browser engines, all of which can run in headless mode:

### 1. Chromium (Most Likely Primary)

**Technology**: Headless Chromium

**What it is:**
- Open-source browser engine based on Chrome/Chromium
- Can run in headless mode (no UI) or headed mode (with UI)
- Playwright bundles Chromium with its installation

**Usage:**
```typescript
// Headless mode (no UI)
const browser = await chromium.launch({ headless: true })

// Headed mode (with UI) - for debugging/viewing
const browser = await chromium.launch({ headless: false })
```

**Why Asteroid likely uses this:**
- Most common choice (default for most Playwright setups)
- Best compatibility with websites (Chrome/Chromium market dominance)
- Excellent performance in headless mode
- Most features and best documentation

---

### 2. Firefox

**Technology**: Headless Firefox

**What it is:**
- Firefox browser engine
- Can also run headless or headed
- More resource-intensive than Chromium

**Usage:**
```typescript
const browser = await firefox.launch({ headless: true })
```

**Why Asteroid might use this:**
- Cross-browser testing
- Sites that specifically work better in Firefox
- Less common (likely not primary choice)

---

### 3. WebKit

**Technology**: Headless WebKit

**What it is:**
- Safari's browser engine
- Can run headless or headed
- Good for Safari-specific compatibility

**Usage:**
```typescript
const browser = await webkit.launch({ headless: true })
```

**Why Asteroid might use this:**
- Safari/macOS compatibility
- Sites optimized for Safari
- Least common (unlikely primary choice)

---

## Headless vs Headed Mode

### Critical Question: Which mode does Asteroid use?

Given their **real-time browser viewing** feature, there are two possibilities:

#### Option 1: Headless Mode + Screenshot Streaming (Likely)

**How it works:**
```typescript
// Server-side: Run in headless mode
const browser = await chromium.launch({ 
  headless: true,  // No UI on server
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})

const page = await browser.newPage()

// Stream screenshots periodically
setInterval(async () => {
  const screenshot = await page.screenshot({
    encoding: 'base64',
    fullPage: false
  })
  // Send via WebSocket to client
  websocket.send({ type: 'screenshot', data: screenshot })
}, 100) // 10fps
```

**Advantages:**
- **Resource efficient**: No GPU/display required
- **Scalable**: Can run many instances on single server
- **Faster**: Headless is faster than headed
- **Standard practice**: Most production automation uses headless

**Evidence supporting this:**
- They stream screenshots (mentioned in session recording docs)
- WebSocket streaming suggests server-side headless + client-side replay
- Production systems typically use headless for scalability

---

#### Option 2: Headed Mode + Viewport Streaming (Less Likely)

**How it works:**
```typescript
// Server-side: Run in headed mode (with UI)
const browser = await chromium.launch({ 
  headless: false,
  args: ['--remote-debugging-port=9222']
})

// Use CDP to stream viewport
const client = await page.context().newCDPSession(page)
await client.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 80
})

client.on('Page.screencastFrame', (frame) => {
  // Stream frames to client
  websocket.send({ type: 'frame', data: frame.data })
})
```

**Advantages:**
- **True live view**: Actual browser viewport streaming
- **Better for debugging**: Can see exactly what browser sees
- **No screenshot overhead**: Direct frame streaming

**Disadvantages:**
- **Resource intensive**: Requires GPU/display on server
- **Less scalable**: Harder to run many instances
- **More complex**: Requires X server or similar on Linux

**Evidence against this:**
- Production systems typically avoid headed mode for scale
- Screenshot streaming is simpler and more reliable
- rrweb replay suggests they're reconstructing, not streaming viewport

---

## SPECULATION: How Anchor Browser + Playwright Work

**What We Know:**
- Anchor Browser provides browser infrastructure
- VNC protocol streams live browser view
- Playwright controls browser automation

**What We Don't Know:**
- Whether browsers are headless or headed
- Which browser engine (Chromium/Firefox/WebKit)
- How Anchor Browser implements VNC streaming

**Possible Architectures** (All Speculation):

### Option 1: Headless + VNC Streaming (Most Likely)

Anchor Browser could:
- Run browsers in headless mode
- Use VNC server to stream headless browser output
- Provide VNC connection for real-time viewing

**Pros**: Scalable, efficient
**Cons**: VNC over headless is less common

### Option 2: Headed + VNC Streaming

Anchor Browser could:
- Run browsers in headed mode (with display)
- Use standard VNC server to stream display
- Provide VNC connection for real-time viewing

**Pros**: Standard VNC setup
**Cons**: More resource intensive

**Note**: Without Anchor Browser documentation, we can't determine which approach they use.

---

## Browser Engine Selection

### Playwright's Browser Installation

When you install Playwright, it downloads browser binaries:

```bash
npx playwright install chromium  # Downloads Chromium
npx playwright install firefox   # Downloads Firefox  
npx playwright install webkit    # Downloads WebKit
```

**Default**: Chromium is the default and most commonly used.

### Asteroid's Likely Setup

**Primary**: Chromium (headless)
- Default Playwright choice
- Best compatibility
- Best performance
- Most resources available

**Secondary**: Firefox/WebKit (if supported)
- For cross-browser testing
- Sites requiring specific browser
- Less common use cases

---

## Headless Browser Technologies Under the Hood

### Chromium Headless

**Built on:**
- **Blink rendering engine**: Chrome's rendering engine
- **V8 JavaScript engine**: Chrome's JavaScript engine
- **Headless shell**: Minimal browser UI for automation

**Capabilities:**
- Full DOM rendering
- JavaScript execution
- Network interception
- Screenshot capture
- PDF generation

**Resource usage:**
- Memory: ~50-200MB per instance (headless)
- CPU: Varies by workload
- Disk: Minimal (browser binary already installed)

---

## Integration with Real-Time Viewing

### How Headless + rrweb Works Together

```typescript
// Server-side (headless browser)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// Inject rrweb recorder
await page.addInitScript(() => {
  // Load rrweb script
  // Start recording DOM mutations
})

// Navigate and interact (headless, no UI)
await page.goto('https://example.com')
await page.click('#button')

// Events are captured by rrweb
// Screenshots captured periodically
// Both streamed via WebSocket

// Client-side (frontend)
// Receives rrweb events + screenshots
// Uses rrweb Replayer to reconstruct view
// Shows "live" browser view to user
```

**Key insight**: The browser runs headless on the server, but users see a reconstructed view on the client using rrweb.

---

## Evidence Summary

### Supports Headless Chromium:

1. **Production requirements**: Need to scale to thousands of agents
2. **Resource efficiency**: Headless is more efficient
3. **Screenshot streaming**: Suggests headless + periodic screenshots
4. **rrweb replay**: Client-side reconstruction of view (not viewport streaming)
5. **Industry standard**: Most automation uses headless

### Evidence Against Headed Mode:

1. **Scalability**: Headed mode is resource-intensive
2. **Infrastructure**: Would require X server/display on Linux servers
3. **Cost**: GPU/display resources expensive at scale
4. **Complexity**: Viewport streaming more complex than screenshots

---

## Conclusion

**What We Know For Sure:**
- ✅ Playwright controls browser automation
- ✅ Anchor Browser manages browser infrastructure  
- ✅ VNC protocol provides real-time viewing

**What We Don't Know:**
- ⚠️ Headless vs headed mode
- ⚠️ Which browser engine (Chromium/Firefox/WebKit)
- ⚠️ How Anchor Browser implements VNC

**Key Insight**: Anchor Browser abstracts away the browser implementation details. We know they provide VNC viewing, but the underlying browser configuration is opaque.

---

## Alternative Possibilities

### If they support multiple browsers:

- **Chromium** (primary): ~90% of use cases
- **Firefox**: For cross-browser testing, specific site requirements
- **WebKit**: For Safari compatibility, macOS-specific sites

### If they use CDP directly:

- Chrome DevTools Protocol can control Chrome/Chromium
- Could bypass Playwright for specific use cases
- Less likely given their explicit Playwright references

---

## Key Takeaways

1. **Headless Chromium** is the most likely choice
2. **Headless mode** for production (scalability, efficiency)
3. **rrweb + screenshots** provide real-time viewing without viewport streaming
4. **Playwright manages** the headless browser lifecycle
5. **Client-side reconstruction** using rrweb gives users the "live view" experience

The magic is in the **orchestration layer**, not the headless browser technology itself—they're using standard, proven technologies.

