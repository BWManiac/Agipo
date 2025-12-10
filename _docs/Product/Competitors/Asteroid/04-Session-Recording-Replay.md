Session Recording & Replay
===========================

## Overview

Asteroid.ai provides real-time viewing and session replay capabilities, allowing users to watch agents navigate websites in real-time or replay past sessions for debugging and verification.

## Core Technology: rrweb

### About rrweb

[rrweb](https://www.rrweb.io/) is an open-source web session replay library that provides easy-to-use APIs to record user interactions and replay them remotely. It's used by companies like PostHog, Highlight, and Pendo for user analysis, bug reproduction, and real-time collaboration.

### Evidence of Usage

**Where We Saw rrweb Being Used:**

1. **Browser Console** (Direct Evidence):
   - `rrweb-plugin-console-record.js:2447` appeared in browser console during agent execution
   - This is the console recording plugin from the rrweb library
   - Found when inspecting the execution dashboard while an agent was running

2. **Source Code References**:
   - References to `lazy-recorder.js` and `dead-clicks-autocapture.js` in their codebase
   - These are related to rrweb's recording capabilities

3. **Execution Dashboard** (Functional Evidence):
   - **Real-time browser view**: Live embedded browser showing agent interactions
   - **Action logs**: Real-time timeline showing DOM interactions ("Navigating to URL", "Clicking on close button")
   - **Feature description**: "Automatic recording and playback of every run"
   - These features match rrweb's capabilities exactly

4. **PostHog Integration** (Indirect Evidence):
   - PostHog source code found in their codebase
   - PostHog uses rrweb for session replay
   - Suggests they're using similar patterns

### What rrweb Does

**Records:**
- DOM mutations (element additions, removals, attribute changes)
- User interactions (clicks, scrolls, inputs, form submissions)
- Console logs
- Network requests (optional)
- Mouse movements and keyboard events

**Replays:**
- Full session reconstruction
- Interactive playback with controls
- Time-travel debugging
- Event-by-event inspection

---

## Architecture

### Recording Phase

```typescript
import { record } from 'rrweb'

// During browser automation
const events: eventWithTime[] = []

const stopRecording = record({
  emit(event) {
    events.push(event)
    
    // Stream to server via WebSocket for live view
    websocket.send(JSON.stringify({
      type: 'rrweb-event',
      event,
      timestamp: Date.now()
    }))
    
    // Also store for replay
    await storeEvent(sessionId, event)
  }
})

// Continue with browser automation...
await page.goto('https://example.com')
await page.click('#button')

// Stop recording when done
stopRecording()
```

### Real-Time Streaming

**WebSocket Infrastructure:**
- WebSocket connections to `odyssey.asteroid.ai`
- Real-time event broadcasting
- Multiple clients can subscribe to same session

**Live View Pattern:**
```typescript
// Server-side: Stream events as they occur
const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) => {
  // Subscribe to session
  ws.on('message', (message) => {
    const { type, sessionId } = JSON.parse(message)
    if (type === 'subscribe') {
      subscribeToSession(ws, sessionId)
    }
  })
})

// When recording emits event
function onRrwebEvent(sessionId: string, event: eventWithTime) {
  // Broadcast to all subscribers
  getSessionSubscribers(sessionId).forEach(ws => {
    ws.send(JSON.stringify({
      type: 'rrweb-event',
      event
    }))
  })
}
```

### Replay Phase

```typescript
import { Replayer } from 'rrweb'
import rrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'

// Load stored events
const events = await loadSessionEvents(sessionId)

// Replay in UI
const replayer = new Replayer(events, {
  root: containerElement,
  speed: 1,
  skipInactive: true
})

replayer.play()
```

---

## Hybrid Approach: rrweb + Screenshots

**Likely Implementation:**

Asteroid.ai likely combines:
1. **rrweb events** for DOM state (lightweight, accurate)
2. **Screenshots** for visual verification (heavier, but visual confirmation)

**Why Both?**
- rrweb: Efficient, captures all interactions
- Screenshots: Visual verification, handles canvas/dynamic content

**Streaming Pattern:**
```typescript
// Periodically capture screenshots (lower frequency)
setInterval(async () => {
  const screenshot = await page.screenshot({
    encoding: 'base64',
    fullPage: false // Viewport only
  })
  
  websocket.send(JSON.stringify({
    type: 'screenshot',
    data: screenshot,
    timestamp: Date.now()
  }))
}, 500) // Every 500ms (2fps for screenshots)

// rrweb events stream continuously (higher frequency)
record({
  emit(event) {
    websocket.send(JSON.stringify({
      type: 'rrweb-event',
      event
    }))
  }
}) // Events stream in real-time
```

---

## Frontend Implementation

### Live View Component

```typescript
export function LiveBrowserView({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const replayerRef = useRef<Replayer | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Initialize live replayer
    replayerRef.current = new Replayer([], {
      root: containerRef.current,
      liveMode: true // Enable live mode
    })
    
    // Connect to WebSocket
    const ws = new WebSocket(`wss://api.asteroid.ai/stream/${sessionId}`)
    
    ws.onmessage = (message) => {
      const { type, event, screenshot } = JSON.parse(message.data)
      
      if (type === 'rrweb-event') {
        // Add event to live replayer
        replayerRef.current?.addEvent(event)
      } else if (type === 'screenshot') {
        // Overlay screenshot for visual verification
        overlayScreenshot(screenshot)
      }
    }
    
    return () => {
      ws.close()
      replayerRef.current?.destroy()
    }
  }, [sessionId])
  
  return <div ref={containerRef} className="browser-replay-viewer" />
}
```

### Replay View Component

```typescript
export function SessionReplay({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Load all events for session
    loadSessionEvents(sessionId).then(events => {
      new rrwebPlayer({
        target: containerRef.current!,
        props: {
          events,
          autoPlay: false,
          speedOption: [0.5, 1, 2, 4],
          showController: true
        }
      })
    })
  }, [sessionId])
  
  return <div ref={containerRef} className="session-replay-viewer" />
}
```

---

## Performance Optimizations

### Event Compression

**Challenge**: rrweb events can be large, especially for complex pages

**Solutions:**
1. **Compress before sending**: Use gzip/brotli
2. **Throttle high-frequency events**: Mouse movements, scrolls
3. **Delta encoding**: Only send changes, not full state
4. **Batching**: Group multiple events in single message

```typescript
// Batch events before sending
const eventBatch: eventWithTime[] = []

function flushBatch() {
  if (eventBatch.length === 0) return
  
  // Compress batch
  const compressed = compress(JSON.stringify(eventBatch))
  
  websocket.send(compressed)
  eventBatch.length = 0
}

// Flush every 100ms or when batch size exceeds threshold
setInterval(flushBatch, 100)

record({
  emit(event) {
    eventBatch.push(event)
    if (eventBatch.length > 50) flushBatch()
  }
})
```

### Screenshot Optimization

**Strategies:**
1. **Viewport only**: Don't capture full page
2. **Lower frequency**: 1-2 fps instead of 30fps
3. **Compression**: JPEG with quality settings
4. **Progressive loading**: Low quality first, enhance later

```typescript
// Optimized screenshot capture
async function captureOptimizedScreenshot(page: Page) {
  return await page.screenshot({
    encoding: 'base64',
    fullPage: false, // Viewport only
    type: 'jpeg',
    quality: 70 // Compression
  })
}
```

---

## Integration with Browser Automation

### Playwright Integration

```typescript
import { chromium } from 'playwright'
import { record } from 'rrweb'

async function setupRecording(page: Page, sessionId: string) {
  // Inject rrweb recorder script
  await page.addInitScript(() => {
    // Load rrweb from CDN or bundle
    // window.rrweb will be available
  })
  
  // Start recording on page load
  await page.evaluate(() => {
    // @ts-ignore
    window.rrwebRecord = window.rrweb.record({
      emit(event) {
        // Send to parent process via CDP or message passing
        window.postMessage({
          type: 'rrweb-event',
          event
        }, '*')
      }
    })
  })
  
  // Listen for events from page
  page.on('console', msg => {
    // Handle console logs as rrweb events
  })
  
  // Stream screenshots
  setInterval(async () => {
    const screenshot = await page.screenshot({ encoding: 'base64' })
    streamScreenshot(sessionId, screenshot)
  }, 500)
}
```

---

## Key Features

### 1. Live Viewing
- Real-time streaming of agent execution
- Watch as it happens
- Low latency (WebSocket)

### 2. Session Replay
- Full playback of past sessions
- Play/pause/speed controls
- Time-travel debugging

### 3. Event Inspection
- View individual events
- See DOM mutations
- Debug interaction issues

### 4. Console Log Integration
- Capture console.log statements
- Debug agent decisions
- Understand AI reasoning

---

## Key Learnings

1. **rrweb is Industry Standard**: 
   - Open-source library used by PostHog, Highlight, Pendo, and others
   - [rrweb.io](https://www.rrweb.io/) provides comprehensive documentation
   - Battle-tested for production use cases

2. **Hybrid Approach**: Combine rrweb events with screenshots
   - rrweb handles DOM state efficiently
   - Screenshots provide visual verification
   - Best of both worlds

3. **Real-Time Requires WebSocket**: HTTP polling too slow
   - WebSocket connections to `odyssey.asteroid.ai` for streaming
   - Low latency for live viewing
   - Multiple clients can subscribe to same session

4. **Performance Matters**: Compress and optimize for scale
   - Event batching and compression
   - Screenshot optimization (lower frequency, compression)
   - Critical for handling thousands of concurrent agents

5. **Live Mode is Key**: Real-time viewing is powerful feature
   - Users can watch agents work in real-time
   - "Pause, intervene, or give new instructions on the fly"
   - Human-in-the-loop capabilities

6. **Standard Library**: No need to build from scratch
   - rrweb provides all core functionality
   - Focus on integration and UX, not replay engine

---

## Implementation Recommendations

For similar capabilities:

1. **Use rrweb**: Battle-tested, widely used
2. **Add Screenshots**: Visual verification complements DOM events
3. **WebSocket Streaming**: Real-time requires persistent connections
4. **Optimize Performance**: Compress, batch, throttle
5. **Standard UI Components**: Use rrweb-player for replay controls

