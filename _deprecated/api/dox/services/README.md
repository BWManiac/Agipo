# DOX Services

> Business logic layer for document operations.

**Domain:** DOX (Documents)

---

## Purpose

This service layer encapsulates all business logic for document operations. Routes call services, not the file system directly. This enables:

- **Centralized logic**: All document manipulation in one place
- **Testability**: Services can be tested independently
- **Reusability**: Services can be used by API routes and agent tools
- **Maintainability**: Clear separation of concerns

---

## Services

### `document-storage.ts`

File I/O operations for reading and writing documents.

**Methods:**
- `readDocument(docId: string)`: Read document from `_tables/dox/[docId]/content.md`
- `writeDocument(docId: string, data: DocumentData)`: Write document to file
- `deleteDocument(docId: string)`: Delete document directory
- `listDocuments()`: Read registry, return docIds

**Dependencies:** `fs/promises`, `gray-matter`, `path`

---

### `markdown-parser.ts`

Conversion between Lexical editor state and Markdown strings.

**Methods:**
- `markdownToLexical(markdown: string)`: Convert Markdown to Lexical editor state
- `lexicalToMarkdown(editorState: LexicalEditorState)`: Convert Lexical state to Markdown

**Critical Patterns:**
- ⚠️ **MUST** call `root.clear()` before `$convertFromMarkdownString()` or content appends
- ⚠️ **MUST** use `editor.update()` for serialization, NOT `editor.getEditorState().read()`

**Dependencies:** `lexical`, `@lexical/markdown`, `TRANSFORMERS`

---

### `frontmatter.ts`

YAML frontmatter parsing and serialization.

**Methods:**
- `parseFrontmatter(markdown: string)`: Parse YAML frontmatter from Markdown
- `serializeFrontmatter(frontmatter: object, content: string)`: Serialize frontmatter + content to Markdown

**Dependencies:** `gray-matter`, `js-yaml`

---

### `outline-generator.ts`

Extract heading structure from Markdown for outline sidebar.

**Methods:**
- `generateOutline(markdown: string)`: Extract headings with hierarchy

**Dependencies:** `remark`, `remark-parse`

---

### `version-manager.ts`

Version tracking and comparison.

**Methods:**
- `createVersion(docId: string, content: string)`: Create new version
- `listVersions(docId: string)`: List all versions
- `getVersion(docId: string, versionId: string)`: Get version content
- `compareVersions(docId: string, versionId1: string, versionId2: string)`: Compare two versions

**Dependencies:** `document-storage`, `diff-match-patch`

---

### `document-manipulation-helpers.ts` (Recommended)

Helper functions for block manipulation to reduce boilerplate.

**Methods:**
- `assertElementNode(node: LexicalNode)`: Type guard + cast for ElementNode operations
- `insertBlockAtPosition(root: RootNode, pos: number, block: ElementNode)`: Insert block
- `deleteBlockAtPosition(root: RootNode, pos: number)`: Delete block
- `replaceBlockContent(block: ElementNode, content: string)`: Replace block content

**Dependencies:** `lexical`, TypeScript types

---

## Pattern Source

- `app/api/records/services/io.ts` - File I/O pattern
- `app/api/records/services/catalog.ts` - Catalog listing pattern

---

**Last Updated:** 2025-12-10
