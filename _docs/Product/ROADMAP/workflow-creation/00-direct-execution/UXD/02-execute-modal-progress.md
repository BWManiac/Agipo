# UXD Mockup: Execute Modal - Execution Progress

## State: Running

While workflow is executing, shows real-time step progress.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Running Workflow                                                  ✕    │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Send Site Content to Email                                             │
│  Executing... (12s elapsed)                                             │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Steps                                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ✓  Navigate to URL                                    0.8s     │   │
│  │     └─ Opened https://example.com                               │   │
│  │                                                                  │   │
│  │  ✓  Fetch Webpage Content                              2.1s     │   │
│  │     └─ Retrieved 2.4kb of content                      [View]   │   │
│  │                                                                  │   │
│  │  ◐  Send Email                                         ...      │   │
│  │     └─ Sending via Gmail...                                     │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                                         [Cancel]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step Status Icons

| Icon | State | Color |
|------|-------|-------|
| ○ | Pending | Gray |
| ◐ | Running | Blue (animated) |
| ✓ | Complete | Green |
| ✕ | Failed | Red |
| ⊘ | Skipped | Gray |

## State: Completed Successfully

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Workflow Complete                                            ✕         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ✓ Send Site Content to Email                                           │
│  Completed successfully in 15.2s                                        │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Steps                                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ✓  Navigate to URL                                    0.8s     │   │
│  │  ✓  Fetch Webpage Content                              2.1s     │   │
│  │  ✓  Send Email                                        12.3s     │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Output                                                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  {                                                      [Copy]  │   │
│  │    "messageId": "abc123",                                       │   │
│  │    "status": "sent",                                            │   │
│  │    "recipient": "john@example.com"                              │   │
│  │  }                                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                            [Run Again]    [Close]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## State: Failed

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Workflow Failed                                              ✕         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ✕ Send Site Content to Email                                           │
│  Failed at step 3 after 14.2s                                           │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Steps                                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ✓  Navigate to URL                                    0.8s     │   │
│  │  ✓  Fetch Webpage Content                              2.1s     │   │
│  │  ✕  Send Email                                        11.3s     │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Error                                                                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ⚠ Gmail API Error                                              │   │
│  │                                                                  │   │
│  │  Failed to send email: Rate limit exceeded.                     │   │
│  │  Please wait 60 seconds before retrying.                        │   │
│  │                                                                  │   │
│  │  Step: Send Email                                               │   │
│  │  Tool: GMAIL_SEND_EMAIL                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                              [Retry]      [Close]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Expanded Step Output

When user clicks [View] on a completed step:

```
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ✓  Fetch Webpage Content                              2.1s     │   │
│  │     ┌───────────────────────────────────────────────────────┐   │   │
│  │     │ {                                                     │   │   │
│  │     │   "title": "Example Domain",                          │   │   │
│  │     │   "content": "This domain is for use in ...",         │   │   │
│  │     │   "url": "https://example.com"                        │   │   │
│  │     │ }                                             [Copy]  │   │   │
│  │     └───────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
```

## Interaction

1. Steps update in real-time as stream events arrive
2. Click on completed step → expands to show output
3. Click [View] → shows full JSON in modal/panel
4. Click [Copy] → copies output to clipboard
5. Cancel → aborts execution (if supported)
6. Run Again → returns to input form with previous values
7. Retry → re-executes with same inputs
