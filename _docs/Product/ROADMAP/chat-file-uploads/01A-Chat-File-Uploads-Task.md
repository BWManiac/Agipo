# Task: Chat File Uploads

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/chat-file-uploads/01-Chat-File-Uploads.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **AI Elements components are the right choice** - Already have file upload UI components
✅ **Mastra supports images natively** - Can pass image URLs in message content
✅ **Server-side document processing is necessary** - PDFs/DOCX need text extraction
✅ **Temporary file storage approach is standard** - Store in public/uploads temporarily

### Current State Analysis
- AI Elements file upload components exist but not integrated
- Chat only accepts text messages currently
- No file upload endpoint exists
- Mastra agent can handle images but not receiving them

## Deterministic Decisions

### Storage Decisions
- **File Storage**: `public/uploads/{userId}/` for temporary files
- **File Retention**: Delete files after 24 hours (cleanup job)
- **Max File Size**: 10MB per file
- **Max Files**: 5 files per message

### Implementation Decisions
- **Use PromptInputProvider**: Wrap chat area for file state management
- **File Types**: images (all), PDF, DOCX, text files
- **Processing**: Images pass through, documents extract text
- **Message Format**: Use parts array with file and text parts

### Error Handling Decisions
- **Large Files**: Reject with clear error message
- **Unsupported Types**: List supported formats in error
- **Processing Failures**: Send file URL without text extraction
- **Upload Failures**: Retry once, then show error

---

## Overview

### Goal

Enable users to upload images and documents directly in the chat interface. Files should be processed and passed to the agent so it can analyze images and read document content, just like modern LLMs (ChatGPT, Claude, etc.).

This is a smaller, focused feature that leverages existing AI Elements file upload components and integrates them with the chat system.

### Relevant Research

**AI Elements Library:**
- `PromptInputProvider` - Manages file attachment state
- `PromptInputActionAddAttachments` - Upload button component
- `PromptInputAttachment` - File preview component
- `PromptInputAttachments` - Container for multiple attachments
- `FileUIPart` type: `{ type: "file", url: string, mediaType: string, filename: string }`
- Already supports: drag-and-drop, paste, file picker

**Current Chat Implementation:**
- `ChatArea` uses `PromptInput` but not `PromptInputProvider`
- `onSendMessage(text: string)` only accepts text
- Messages use `parts` array: `[{ type: "text", text: string }]`
- `useChatMemory` hook calls `sendMessage({ text })`

**Mastra Image Support:**
- Mastra agents support images: `content: [{ type: "image", image: "url", mimeType: "image/jpeg" }]`
- Can combine text and images in same message
- Agent can analyze images using vision models

**File Processing:**
- Images: Pass URL directly to Mastra
- Documents: Need server-side extraction (PDF → text, DOCX → text)
- Libraries: `pdf-parse` for PDF, `mammoth` for DOCX

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/types.ts` | Modify | Add file upload types | A, B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/chat/upload/route.ts` | Create | File upload endpoint | A |
| `app/api/workforce/[agentId]/chat/route.ts` | Modify | Accept file parts in messages | B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/file-storage.ts` | Create | File upload and storage | A |
| `app/api/workforce/services/document-processor.ts` | Create | PDF/DOCX text extraction | A |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Handle file parts in formatMessages() | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/ChatArea.tsx` | Modify | Add PromptInputProvider, file upload UI | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/FileAttachmentPreview.tsx` | Create | Display file attachments in messages | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useChatMemory.tsx` | Modify | Update sendMessage to handle files | B |

---

## Part A: File Upload & Processing Backend

### Goal

Create backend infrastructure to handle file uploads, store files temporarily, and extract text from documents (PDF, DOCX).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/[agentId]/chat/upload/route.ts` | Create | File upload endpoint | ~100 |
| `app/api/workforce/services/file-storage.ts` | Create | File storage and URL generation | ~120 |
| `app/api/workforce/services/document-processor.ts` | Create | PDF/DOCX text extraction | ~150 |

### Pseudocode

#### `app/api/workforce/[agentId]/chat/upload/route.ts`

```
POST /api/workforce/[agentId]/chat/upload
├── Authenticate user
├── Parse multipart/form-data:
│   └── file: File
├── Validate:
│   ├── File type: image/*, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/*
│   ├── File size: max 10MB
│   └── File count: max 5 per request
├── Save file:
│   ├── Generate unique filename: `${nanoid()}-${originalName}`
│   ├── Save to: `public/uploads/${userId}/${filename}`
│   └── Create directory if needed
├── Process file:
│   ├── If image: Return URL directly
│   ├── If PDF: Extract text, return { url, text }
│   ├── If DOCX: Extract text, return { url, text }
│   └── If text: Read content, return { url, text }
├── Return:
│   └── { url: string, filename: string, mediaType: string, text?: string }
└── Handle errors (file too large, invalid type, etc.)
```

#### `app/api/workforce/services/file-storage.ts`

```
FileStorageService
├── saveFile(file: File, userId: string)
│   ├── Generate filename: `${nanoid()}-${file.name}`
│   ├── Create directory: `public/uploads/${userId}/`
│   ├── Write file to disk
│   ├── Generate URL: `/uploads/${userId}/${filename}`
│   └── Return { url, filename, size, mediaType }
├── deleteFile(url: string)
│   └── Remove file from disk
└── getFileUrl(filename: string, userId: string)
    └── Return full URL path
```

#### `app/api/workforce/services/document-processor.ts`

```
DocumentProcessor
├── extractTextFromPDF(filePath: string)
│   ├── Read PDF file
│   ├── Use pdf-parse to extract text
│   └── Return extracted text
├── extractTextFromDOCX(filePath: string)
│   ├── Read DOCX file
│   ├── Use mammoth to extract text
│   └── Return extracted text
└── extractText(file: File, filePath: string)
    ├── Check mediaType
    ├── If PDF: extractTextFromPDF()
    ├── If DOCX: extractTextFromDOCX()
    ├── If text: read file content
    └── Return text or null (for images)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | File upload endpoint accepts files | POST file, verify 200 response with URL |
| AC-A.2 | Files saved to disk | Verify file exists in uploads directory |
| AC-A.3 | File URLs generated correctly | Verify URL is accessible |
| AC-A.4 | PDF text extraction works | Upload PDF, verify text extracted |
| AC-A.5 | DOCX text extraction works | Upload DOCX, verify text extracted |
| AC-A.6 | File size validation | Upload 15MB file, verify 400 error |
| AC-A.7 | File type validation | Upload .exe file, verify 400 error |
| AC-A.8 | Images return URL only | Upload image, verify no text field |

---

## Part B: Frontend Integration & Message Handling

### Goal

Wire up file upload UI in ChatArea, handle file uploads before sending messages, and update message format to include file parts.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/ChatArea.tsx` | Modify | Add PromptInputProvider, file upload UI | ~150 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/FileAttachmentPreview.tsx` | Create | Display attachments in messages | ~80 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useChatMemory.tsx` | Modify | Update sendMessage to handle files | ~100 |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Handle file parts in messages | ~80 |
| `app/api/workforce/[agentId]/chat/route.ts` | Modify | Accept file parts, format for Mastra | ~50 |

### Pseudocode

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/ChatArea.tsx` (modifications)

```
ChatArea
├── Wrap with PromptInputProvider:
│   └── <PromptInputProvider>
│       └── Existing ChatArea content
├── Add file upload button:
│   └── <PromptInputActionAddAttachments /> (in PromptInputHeader)
├── Add file previews:
│   └── <PromptInputAttachments /> (above textarea)
├── Update handleSubmit:
│   ├── Get files from attachments context
│   ├── If files exist:
│   │   ├── Upload files to /api/workforce/[agentId]/chat/upload
│   │   ├── Get file URLs and metadata
│   │   └── Call onSendMessage with text + files
│   └── Else: Call onSendMessage with text only
└── Update onSendMessage prop type:
    └── (text: string, files?: FilePart[]) => void
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useChatMemory.tsx` (modifications)

```
useChatMemory
├── Update handleSend:
│   ├── Accept files parameter: handleSend(text: string, files?: FilePart[])
│   ├── Build message parts:
│   │   ├── Text part: { type: "text", text }
│   │   ├── File parts: files.map(f => ({ type: "file", url: f.url, ... }))
│   │   └── Combine into parts array
│   └── Call sendMessage({ parts }) instead of sendMessage({ text })
└── Update message loading:
    ├── Handle file parts in loaded messages
    └── Convert file parts to display format
```

#### `app/api/workforce/[agentId]/chat/services/chat-service.ts` (modifications)

```
formatMessages(messages, context?)
├── Existing: Handle text content
├── NEW: Handle file parts:
│   ├── For each message:
│   │   ├── Extract text parts (existing)
│   │   ├── Extract file parts:
│   │   │   └── Filter parts where type === "file"
│   │   └── Build Mastra message format:
│   │       ├── If has files:
│   │       │   └── content: [
│   │       │       { type: "text", text: textContent },
│   │       │       ...files.map(f => ({
│   │       │         type: "image",
│   │       │         image: f.url,
│   │       │         mimeType: f.mediaType
│   │       │       }))
│   │       │     ]
│   │       └── Else: content: textContent (string)
│   └── Return formatted messages
└── Handle document text:
    ├── If file has extracted text:
    │   └── Include in text content: "Document content: {text}\n\n{userMessage}"
    └── Else: Just include user message
```

#### `app/api/workforce/[agentId]/chat/route.ts` (modifications)

```
POST /api/workforce/[agentId]/chat
├── Existing: Parse messages, load agent
├── NEW: Handle file parts in messages:
│   ├── Check if messages contain file parts
│   ├── If files need processing:
│   │   ├── Upload files (if not already uploaded)
│   │   ├── Extract text from documents
│   │   └── Update message parts with URLs and text
│   └── Pass to formatMessages()
├── Continue with existing agent execution
└── Agent receives messages with image/file content
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/FileAttachmentPreview.tsx`

```
FileAttachmentPreview({ file, onRemove })
├── Render:
│   ├── If image:
│   │   └── <img src={file.url} alt={file.filename} />
│   ├── If document:
│   │   └── <div>📄 {file.filename}</div>
│   └── Remove button (if onRemove provided)
└── Display in message bubble
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | File upload button appears | Verify paperclip icon in input area |
| AC-B.2 | File picker opens on click | Click button, verify file dialog |
| AC-B.3 | Files appear as previews | Upload file, verify preview above input |
| AC-B.4 | Files can be removed | Click X on preview, verify removed |
| AC-B.5 | Drag-and-drop works | Drag file into input, verify added |
| AC-B.6 | Paste image works | Paste image, verify added |
| AC-B.7 | Files upload before send | Send message with files, verify upload API called |
| AC-B.8 | Message includes file parts | Verify message payload contains file data |
| AC-B.9 | Agent receives images | Upload image, verify agent can see it |
| AC-B.10 | Agent receives document text | Upload PDF, verify agent receives text |
| AC-B.11 | Files display in message history | Send file, reload, verify file shown in history |

---

## User Flows

### Flow 1: Upload and Send Image

```
1. User clicks paperclip icon
2. File picker opens
3. User selects image.png
4. Image preview appears above input
5. User types: "What's in this image?"
6. User clicks send
7. System uploads image, gets URL
8. Message sent with image part
9. Agent analyzes image and responds
```

### Flow 2: Upload Document

```
1. User uploads resume.pdf
2. Document preview appears
3. User types: "Review my resume"
4. User sends
5. System extracts text from PDF
6. Message sent with: text content + document text
7. Agent receives and analyzes resume
```

---

## Out of Scope

- **File management UI**: No file library or permanent storage
- **File editing**: Cannot edit files in chat
- **Advanced parsing**: No OCR, no complex PDF features
- **Video/audio**: Only images and documents
- **File sharing**: Files are per-conversation

---

## Open Questions

- [ ] Should files be stored permanently or deleted after conversation?
- [ ] What's the file size limit? (Start with 10MB per file)
- [ ] How many files per message? (Start with 5)
- [ ] Should we show upload progress? (Probably yes for large files)
- [ ] How to handle file upload errors? (Show error, allow retry)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
