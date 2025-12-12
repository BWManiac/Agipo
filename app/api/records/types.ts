/**
 * Unified Types for Records Domain
 *
 * This module defines types for the consolidated records feature,
 * which includes both tables (structured data) and documents (unstructured content),
 * organized in a folder hierarchy.
 */

import { z } from "zod";

// =============================================================================
// Item Types (Tables + Documents)
// =============================================================================

/** The type of item in the records system */
export type ItemType = "table" | "document" | "folder";

/** Base metadata shared by all items */
export interface ItemMetadata {
  id: string;
  name: string;
  type: ItemType;
  description?: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null; // null = root folder
}

/** Table-specific metadata */
export interface TableMetadata extends ItemMetadata {
  type: "table";
  recordCount: number;
  columnCount: number;
}

/** Document-specific metadata */
export interface DocumentMetadata extends ItemMetadata {
  type: "document";
  wordCount: number;
  tags: string[];
}

/** Folder-specific metadata */
export interface FolderMetadata extends ItemMetadata {
  type: "folder";
  itemCount: number;
  color?: string; // Optional folder color
}

/** Union type for any item */
export type AnyItemMetadata = TableMetadata | DocumentMetadata | FolderMetadata;

// =============================================================================
// Folder Types
// =============================================================================

/** Folder tree node for sidebar display */
export interface FolderTreeNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderTreeNode[];
  itemCount: number;
}

/** Folder contents response */
export interface FolderContents {
  folder: FolderMetadata | null; // null for root
  items: AnyItemMetadata[];
  breadcrumbs: BreadcrumbItem[];
}

/** Breadcrumb navigation item */
export interface BreadcrumbItem {
  id: string | null; // null for root
  name: string;
}

// =============================================================================
// Document Types (from docs feature)
// =============================================================================

/** Agent access permission for a document */
export interface AgentAccess {
  agentId: string;
  permission: "read" | "read_write";
  grantedAt: string;
}

/** Document frontmatter stored in markdown files */
export interface DocumentFrontmatter {
  id: string;
  title: string;
  description?: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  agentsWithAccess: AgentAccess[];
  folderId: string | null;
}

/** Full document with content */
export interface Document {
  frontmatter: DocumentFrontmatter;
  content: string;
}

/** Document version for history */
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

// =============================================================================
// Table Types (from records feature)
// =============================================================================

/** Table schema validator */
export const TableSchemaValidator = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  columns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["text", "number", "date", "boolean", "select"]),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
    })
  ),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  folderId: z.string().nullable().optional(),
});

export type TableSchema = z.infer<typeof TableSchemaValidator>;

// =============================================================================
// API Request/Response Types
// =============================================================================

// Folder Operations
export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
  color?: string;
}

export interface CreateFolderResponse {
  folder: FolderMetadata;
}

export interface UpdateFolderRequest {
  name?: string;
  color?: string;
}

export interface MoveItemRequest {
  targetFolderId: string | null; // null = move to root
}

// Document Operations
export interface CreateDocumentRequest {
  title?: string;
  folderId?: string | null;
}

export interface CreateDocumentResponse {
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

// Table Operations
export interface CreateTableRequest {
  name: string;
  description?: string;
  columns?: TableSchema["columns"];
  folderId?: string | null;
}

// List Operations
export interface ListItemsRequest {
  folderId?: string | null;
  type?: ItemType;
  search?: string;
}

export interface ListItemsResponse {
  items: AnyItemMetadata[];
  total: number;
}

// Search Operations
export interface SearchRequest {
  query: string;
  type?: ItemType;
}

export interface SearchResponse {
  results: AnyItemMetadata[];
  total: number;
}
