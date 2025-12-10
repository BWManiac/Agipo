Headless Browser Technology
============================

## Overview

Since Asteroid.ai uses Playwright as their primary browser automation engine, the headless browser technology is determined by what Playwright uses under the hood.

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

## Most Likely Architecture

Based on evidence, Asteroid.ai likely uses:

### **Headless Chromium** (Primary)

```typescript
// Production execution (headless)
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ]
})

// For real-time viewing:
// 1. Inject rrweb recorder
// 2. Stream DOM events via WebSocket
// 3. Periodically capture screenshots
// 4. Client-side reconstructs view using rrweb Replayer
```

**Why this makes sense:**
1. **Scalability**: Headless can run many instances per server
2. **Cost efficiency**: No GPU/display requirements
3. **Performance**: Headless is faster than headed
4. **Real-time view**: rrweb events + screenshots provide live view
5. **Industry standard**: Most browser automation uses headless

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

**Most Likely**: Asteroid.ai uses **Headless Chromium** powered by Playwright.

**How real-time viewing works**:
1. Browser runs headless on server (no UI)
2. rrweb records DOM mutations and events
3. Screenshots captured periodically
4. Both streamed via WebSocket to client
5. Client uses rrweb Replayer to reconstruct "live" view
6. User sees real-time browser interaction without actual viewport streaming

This gives them:
- ✅ Scalable headless execution
- ✅ Efficient resource usage
- ✅ Real-time viewing capability
- ✅ Full session replay

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

