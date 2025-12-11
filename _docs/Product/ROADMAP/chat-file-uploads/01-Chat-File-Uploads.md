# Chat File Uploads

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables users to upload resumes, job postings, and other documents directly in chat for the Job Application Agent to analyze and process. Critical for the resume tailoring workflow.

---

## Problem Statement

Currently, users can only send text messages to agents. They cannot upload images, documents, or other files that the agent could analyze. This limits use cases like:

- Uploading a resume for the agent to review
- Sharing screenshots of job postings
- Sending PDF documents for analysis
- Including images in conversations for context

The AI Elements library (`@/components/ai-elements/prompt-input`) already has file attachment support built in, but the ChatArea component isn't using it. We need to wire up the file upload UI and ensure files are properly sent to the agent.

---

## User Value

- **Upload files directly in chat** - No need to use separate file management
- **Agent can analyze images** - Upload screenshots, diagrams, photos for agent to understand
- **Document processing** - Upload PDFs, Word docs, text files for agent to read
- **Visual context** - Include images alongside text messages
- **Resume analysis** - Upload resume for Job Application Agent to review and tailor
- **Job posting sharing** - Screenshot or PDF of job posting for agent to analyze

---

## User Flows

### Flow 1: Upload Image in Chat

```
1. User opens chat with agent
2. User clicks paperclip icon (or drags image into input area)
3. File picker opens
4. User selects image file (PNG, JPG, etc.)
5. Image preview appears above input area
6. User types message: "What do you see in this image?"
7. User clicks send
8. Message sent with image attached
9. Agent receives image and analyzes it
10. Agent responds with analysis
```

### Flow 2: Upload Document

```
1. User clicks paperclip icon
2. User selects PDF document (resume.pdf)
3. Document preview appears (icon + filename)
4. User types: "Review my resume and suggest improvements"
5. User sends message
6. System uploads file to storage (or converts to text)
7. Agent receives document content
8. Agent analyzes and provides feedback
```

### Flow 3: Paste Image

```
1. User copies image to clipboard
2. User pastes (Cmd+V) into chat input
3. Image automatically added as attachment
4. User can type message and send
```

### Flow 4: Multiple Files

```
1. User uploads 3 files: resume.pdf, cover-letter.docx, job-posting.png
2. All 3 appear as attachments above input
3. User types: "Tailor my resume and cover letter for this job posting"
4. User sends
5. Agent receives all 3 files and processes them together
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `components/ai-elements/prompt-input.tsx` | Existing file upload UI components | `PromptInputProvider`, `PromptInputAttachment`, `PromptInputActionAddAttachments` |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/ChatArea.tsx` | Chat input component | Current implementation, needs file upload integration |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useChatMemory.tsx` | Chat message sending | `sendMessage()` function, message format |
| `app/api/workforce/[agentId]/chat/route.ts` | Chat API endpoint | How messages are received and processed |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Message formatting | `formatMessages()` function, needs to handle file parts |
| Mastra agent API | Image/document processing | How to pass images to agent.generate() |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **File Storage** | Upload to temporary storage, return URL | Files need to be accessible to agent, URLs are simpler than base64 |
| **Storage Location** | `/public/uploads/` or cloud storage (future) | Start with local, can migrate to S3/Cloudflare R2 later |
| **File Size Limits** | 10MB per file, 50MB total per message | Prevent abuse, reasonable for most documents |
| **Supported Formats** | Images (PNG, JPG, GIF, WebP), Documents (PDF, DOCX, TXT) | Common formats agents can process |
| **Image Processing** | Pass image URL to Mastra | Mastra supports image content in messages |
| **Document Processing** | Convert to text server-side, pass text to agent | PDF/DOCX need extraction, then pass as text |
| **UI Library** | Use existing AI Elements components | Already built, just need to wire up |
| **File Upload Endpoint** | `POST /api/workforce/[agentId]/chat/upload` | Separate endpoint for file uploads before sending message |

---

## Constraints

- **AI Elements Library**: Must use existing `PromptInput` components (can't rebuild)
- **Mastra Image Support**: Mastra supports images via `content: [{ type: "image", image: "url" }]`
- **File Size**: Large files may be slow to upload/process
- **Storage**: Need temporary file storage (local for MVP, cloud later)
- **Document Parsing**: PDF/DOCX need server-side extraction libraries
- **Message Format**: Must extend current message format to include file parts

---

## Success Criteria

- [ ] User can click paperclip icon to upload files
- [ ] User can drag-and-drop files into input area
- [ ] User can paste images from clipboard
- [ ] File previews appear above input before sending
- [ ] User can remove files before sending
- [ ] Files upload to storage and get URLs
- [ ] Messages with files are sent to agent
- [ ] Agent receives and can process images
- [ ] Agent receives and can process documents (as text)
- [ ] File attachments display in message history
- [ ] Multiple files can be attached to one message
- [ ] File size validation works (rejects oversized files)

---

## Out of Scope

- **File Management**: No file library or permanent storage (temporary only)
- **File Editing**: Cannot edit files in chat (upload only)
- **Advanced Document Features**: No OCR, no complex PDF parsing (basic text extraction)
- **Video/Audio**: Only images and documents (no media files)
- **File Sharing**: Files are per-conversation, not shareable across chats
- **Version Control**: No file versioning or history

---

## Open Questions

- **File Persistence**: How long should uploaded files be stored?
  - Option A: Until conversation ends (temporary)
  - Option B: Permanently (linked to thread)
- **Document Extraction**: Which library for PDF/DOCX?
  - PDF: `pdf-parse` or `pdfjs-dist`?
  - DOCX: `mammoth` or `docx`?
- **Image Format**: Pass as URL or base64?
  - URL: Requires storage, but cleaner
  - Base64: No storage needed, but larger payloads
- **File Limits**: How many files per message?
  - Start with 5 files, make configurable later
- **Error Handling**: What if file upload fails?
  - Show error, allow retry, or fail message send?

---

## Technical Architecture (High-Level)

### Backend Changes

1. **File Upload Endpoint**
   - `POST /api/workforce/[agentId]/chat/upload`
   - Accepts multipart/form-data
   - Validates file type and size
   - Saves to temporary storage
   - Returns file URL and metadata

2. **Document Processing Service**
   - `app/api/workforce/services/document-processor.ts`
   - PDF → text extraction
   - DOCX → text extraction
   - Returns extracted text

3. **Message Format Extension**
   - Update `formatMessages()` to handle file parts
   - Convert file URLs to Mastra image format
   - Include document text in message content

4. **Chat API Update**
   - Accept file parts in message payload
   - Process files (upload if needed, extract text)
   - Format for Mastra agent

### Frontend Changes

1. **ChatArea Enhancement**
   - Wrap with `PromptInputProvider`
   - Add `PromptInputActionAddAttachments` button
   - Add `PromptInputAttachments` to show file previews
   - Update `sendMessage` to include file parts

2. **File Upload Handling**
   - Upload files before sending message
   - Store file URLs/metadata
   - Include in message payload

3. **Message Display**
   - Show file attachments in message history
   - Use `MessageAttachment` component for display

---

## References

- [Mastra Agents - Working with Images](https://mastra.ai/docs/agents/overview#working-with-images) - Image content format
- Existing components: `components/ai-elements/prompt-input.tsx` (file upload UI)
- Existing components: `components/ai-elements/message.tsx` (MessageAttachment)
- Chat implementation: `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/`
- Related feature: `_docs/Product/ROADMAP/rag-integration/01-RAG-for-Records-and-Docs.md` (document processing)

---

## Related Roadmap Items

- **RAG Integration**: Uploaded documents could be indexed for RAG
- **Document Storage**: Permanent document storage (future)
- **Advanced Document Processing**: OCR, complex PDF parsing (future)
