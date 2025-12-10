// Document Types for the Docs Feature (22b implementation)

export interface AgentAccess {
  agent_id: string;
  permission: "read" | "read_write";
  granted_at: string;
}

export interface DocumentFrontmatter {
  id: string;
  title: string;
  description?: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  agents_with_access: AgentAccess[];
}

export interface Document {
  frontmatter: DocumentFrontmatter;
  content: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  description?: string;
  updated: string;
  wordCount: number;
  tags: string[];
}

export interface DocumentVersion {
  id: string;
  timestamp: string;
  author: {
    type: "user" | "agent";
    id: string;
    name: string;
  };
  wordCount: number;
  summary?: string;
}

// API Request/Response Types

export interface CreateDocumentRequest {
  title?: string;
}

export interface CreateDocumentResponse {
  document: Document;
}

export interface GetDocumentResponse {
  document: Document;
}

export interface UpdateDocumentRequest {
  content?: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDocumentResponse {
  document: Document;
  version?: DocumentVersion;
}

export interface ListDocumentsResponse {
  documents: DocumentListItem[];
  total: number;
}

export interface ListVersionsResponse {
  versions: DocumentVersion[];
}

export interface RestoreVersionResponse {
  document: Document;
  newVersion: DocumentVersion;
}
