# UXD Mockup: Execute Modal - Input Form

## State: Collecting Inputs

When user clicks "Run" and workflow has runtime inputs defined.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  Run Workflow                                                      ✕    │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Send Site Content to Email                                             │
│  Enter the values for this workflow's inputs.                           │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Email Address *                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ john@example.com                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  The recipient email address                                            │
│                                                                         │
│  Website URL *                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ https://example.com                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  The URL to fetch content from                                          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Connections                                                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Gmail                          john@gmail.com                │   │
│  │  ✓ Browser Tool                   Connected                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│                                           [Cancel]    [Execute ▶]       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

| Element | Component | Notes |
|---------|-----------|-------|
| Modal | `Dialog` | From `@/components/ui/dialog` |
| Title | `DialogTitle` | Workflow name |
| Description | `DialogDescription` | Helper text |
| Input fields | `Input` | Type-aware (string, number, boolean) |
| Field labels | `Label` | Show * for required |
| Field descriptions | `p.text-muted-foreground` | Optional helper text |
| Connections | Custom card | Show status of required connections |
| Buttons | `Button` | Cancel (variant="outline"), Execute (default) |

## States

### All inputs valid + connections available
- Execute button enabled
- Green checkmarks on connections

### Missing required input
- Execute button disabled
- Field shows validation error

### Missing connection
- Execute button disabled
- Connection shows warning icon + "Not connected"
- Link to connect

```
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✓ Gmail                          john@gmail.com                │   │
│  │  ⚠ Slack                          Not connected  [Connect →]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
```

## Interaction

1. User fills in input fields
2. Validation runs on blur
3. Execute button enables when all required fields valid AND all connections available
4. Click Execute → transitions to Execution Progress view
