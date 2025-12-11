# Chat File Uploads - Implementation Phases

## Phase 1: Backend File Processing

### Goal
Create file upload endpoint with document text extraction.

### File Impact
- Create: `app/api/workforce/[agentId]/chat/upload/route.ts`
- Create: `app/api/workforce/services/file-storage.ts`
- Create: `app/api/workforce/services/document-processor.ts`

### Pseudocode
```typescript
// upload/route.ts
POST: Parse multipart, validate file, save to disk, extract text if document
Return: { url, filename, mediaType, text? }

// document-processor.ts
extractText(file): 
  - PDF: use pdf-parse
  - DOCX: use mammoth
  - Text: read directly
```

### Testing
```bash
curl -F "file=@test.pdf" /api/workforce/[id]/chat/upload
```

---

## Phase 2: Frontend Integration

### Goal
Add file upload UI to chat using AI Elements components.

### File Impact
- Modify: `ChatArea.tsx` - Add PromptInputProvider
- Modify: `useChatMemory.tsx` - Handle file parts
- Create: `FileAttachmentPreview.tsx`

### Pseudocode
```tsx
// ChatArea with files
<PromptInputProvider>
  <PromptInput>
    <PromptInputActionAddAttachments />
    <PromptInputAttachments />
    <PromptInputField />
  </PromptInput>
</PromptInputProvider>

// Send with files
sendMessage({ 
  text, 
  files: attachments.map(f => ({ url, mediaType, filename }))
})
```

---

## Success Metrics
- File upload < 2 seconds
- PDF text extraction accuracy > 95%
- Images display in chat correctly