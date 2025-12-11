# Chat File Uploads - API Specification

## 1. Upload File

### Request
```http
POST /api/workforce/[agentId]/chat/upload
Content-Type: multipart/form-data

file: <binary>
```

### Response
```json
{
  "success": true,
  "file": {
    "url": "/uploads/user123/abc-document.pdf",
    "filename": "document.pdf",
    "mediaType": "application/pdf",
    "text": "Extracted text content...",
    "size": 245632
  }
}
```

### Error Response
```json
{
  "error": "File too large. Maximum size is 10MB."
}
```

---

## 2. Send Message with Files

### Request
```http
POST /api/workforce/[agentId]/chat
Content-Type: application/json

{
  "message": "What's in this document?",
  "files": [
    {
      "url": "/uploads/user123/abc-document.pdf",
      "mediaType": "application/pdf",
      "filename": "document.pdf"
    }
  ],
  "threadId": "thread-123"
}
```

### Response
```json
{
  "success": true,
  "response": "The document contains...",
  "usage": { "promptTokens": 500, "completionTokens": 150 }
}
```

---

## Supported File Types
- Images: jpg, png, gif, webp, svg
- Documents: pdf, docx, txt, md
- Max size: 10MB per file
- Max files: 5 per message