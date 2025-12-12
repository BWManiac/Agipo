# UXD Mockup: Editor Header with Run Button

## Current State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  Send Site Content to Email                                          [Save]    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Proposed State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  Send Site Content to Email                              [▶ Run]    [Save]     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Button States

### Enabled (workflow saved & valid)
```
[▶ Run]     — Primary outline, blue icon
```

### Disabled (workflow not saved)
```
[▶ Run]     — Grayed out, tooltip: "Save workflow to run"
```

### Disabled (workflow has errors)
```
[▶ Run]     — Grayed out, tooltip: "Fix workflow errors to run"
```

### Running
```
[◐ Running...]  — Disabled with spinner, indicates execution in progress
```

## Visual Design

| Element | Style |
|---------|-------|
| Run button | `variant="outline"` with play icon |
| Icon | `Play` from lucide-react, size 16 |
| Spacing | 8px gap between Run and Save |
| Save button | Stays as-is (primary) |

## Interaction

1. Hover → Shows tooltip if disabled (reason why)
2. Click (enabled) → Opens Execute Modal
3. Click (disabled) → Nothing, shows tooltip
4. During execution → Button shows "Running..." with spinner
5. Execution complete → Returns to "Run" state
