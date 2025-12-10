// Barrel export for document services

export {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  documentExists,
} from "./document-io";

export type {
  Document,
  DocumentFrontmatter,
  DocumentListItem,
  DocumentVersion,
  AgentAccess,
  CreateDocumentRequest,
  CreateDocumentResponse,
  GetDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
  ListDocumentsResponse,
  ListVersionsResponse,
  RestoreVersionResponse,
} from "./types";
