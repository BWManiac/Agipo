# AI Elements

**Source:** [ai-sdk.dev/elements](https://ai-sdk.dev/elements)  
**Version:** v1.6.3  
**Last Updated:** December 6, 2025

---

## About

This folder contains [AI Elements](https://vercel.com/changelog/introducing-ai-elements) - a component library built on shadcn/ui for AI interfaces.

**Install/Update Command:**
```bash
npx ai-elements@latest
```

---

## Customized Files

The following 5 files have been customized from the original AI Elements:

| File | Customization | Why |
|------|---------------|-----|
| `message.tsx` | Next.js `<Image>` instead of `<img>`, `useMemo` for children, `className` passthrough | Performance optimization |
| `prompt-input.tsx` | Blob URL cleanup on unmount, `useCallback` wrappers, form scope finding | Memory leak prevention |
| `code-block.tsx` | Added `hast` type import | TypeScript type safety |
| `conversation.tsx` | `overflow-y-auto` instead of `hidden` | Scroll behavior preference |
| `tool.tsx` | Fallback logic for unknown states | Defensive coding |

**⚠️ When updating AI Elements:**
1. Run `npx ai-elements@latest`
2. Re-apply customizations to the 5 files above from `_backup/ai-elements.legacy/` (if still exists) or from git history

---

## File Inventory (30 total)

### Customized (5)
- `code-block.tsx`
- `conversation.tsx`
- `message.tsx`
- `prompt-input.tsx`
- `tool.tsx`

### Fresh from AI Elements (25)
- `artifact.tsx`
- `canvas.tsx`
- `chain-of-thought.tsx`
- `checkpoint.tsx`
- `confirmation.tsx`
- `connection.tsx`
- `context.tsx`
- `controls.tsx`
- `edge.tsx`
- `image.tsx`
- `inline-citation.tsx`
- `loader.tsx`
- `model-selector.tsx`
- `node.tsx`
- `open-in-chat.tsx`
- `panel.tsx`
- `plan.tsx`
- `queue.tsx`
- `reasoning.tsx`
- `shimmer.tsx`
- `sources.tsx`
- `suggestion.tsx`
- `task.tsx`
- `toolbar.tsx`
- `web-preview.tsx`

