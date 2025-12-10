/**
 * Document Tools
 * 
 * 9 document manipulation tools for agents.
 * 
 * CRITICAL PATTERNS (from Phase 0):
 * - Must call root.clear() before $convertFromMarkdownString()
 * - Must use editor.update() for serialization
 * - Must cast to ElementNode for block operations
 * - Must use array syntax for splice(): splice(pos, 0, [block]) or splice(pos, 1, [])
 */

import { createEditor } from "lexical";
import { $getRoot } from "lexical";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import {
  $createParagraphNode,
  $createTextNode,
  type ElementNode,
} from "lexical";
import { readDocument, writeDocument } from "../../../services/document-storage";
import { markdownToLexical, lexicalToMarkdown } from "../../../services/markdown-parser";
import { tool } from "ai";
import type { Tool } from "ai";

// Helper to ensure proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTool(config: any): Tool<unknown, unknown> {
  return tool(config) as Tool<unknown, unknown>;
}

function createLexicalEditor() {
  return createEditor({
    namespace: "dox-agent-tools",
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  });
}

// Tool definitions will be created in buildDocumentTools with docId context

// Tool definitions created in buildDocumentTools with docId context

/**
 * Build document tools with docId context
 */
export function buildDocumentTools(docId: string): Record<string, Tool<unknown, unknown>> {
  return {
    sys_doc_read: createTool({
      description: "Read the entire document content, properties, and outline.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }
        return {
          title: doc.title,
          content: doc.content,
          properties: doc.properties,
        };
      },
    }),
    sys_doc_get_section: createTool({
      description: "Get the content of a specific section identified by a heading.",
      parameters: {
        type: "object",
        properties: {
          sectionText: {
            type: "string",
            description: "The heading text of the section to retrieve",
          },
        },
        required: ["sectionText"],
      },
      execute: async ({ sectionText }: { sectionText: string }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }
        // Find section by heading text
        const lines = doc.content.split("\n");
        let inSection = false;
        let sectionContent: string[] = [];
        for (const line of lines) {
          if (line.startsWith("#") && line.includes(sectionText)) {
            inSection = true;
            continue;
          }
          if (inSection && line.startsWith("#")) {
            break;
          }
          if (inSection) {
            sectionContent.push(line);
          }
        }
        return {
          section: sectionText,
          content: sectionContent.join("\n"),
        };
      },
    }),
    sys_doc_search: createTool({
      description: "Search for text within the document.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
        },
        required: ["query"],
      },
      execute: async ({ query }: { query: string }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }
        const matches: Array<{ line: number; text: string }> = [];
        const lines = doc.content.split("\n");
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            matches.push({ line: index + 1, text: line });
          }
        });
        return { matches };
      },
    }),
    sys_doc_insert: createTool({
      description: "Insert new content at a specific position in the document.",
      parameters: {
        type: "object",
        properties: {
          position: {
            type: "number",
            description: "Block position (0 = start, -1 = end)",
          },
          content: {
            type: "string",
            description: "Markdown content to insert",
          },
        },
        required: ["position", "content"],
      },
      execute: async ({
        position,
        content,
      }: {
        position: number;
        content: string;
      }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }

        const editor = createLexicalEditor();
        editor.update(() => {
          const root = $getRoot();
          root.clear(); // CRITICAL: Clear first
          $convertFromMarkdownString(doc.content, TRANSFORMERS);
        });

        editor.update(() => {
          const root = $getRoot();
          const newBlock = $createParagraphNode();
          newBlock.append($createTextNode(content));
          const insertPos = position === -1 ? root.getChildrenSize() : position;
          root.splice(insertPos, 0, [newBlock]); // Array required
        });

        let newMarkdown = "";
        editor.update(() => {
          newMarkdown = $convertToMarkdownString(TRANSFORMERS);
        });

        await writeDocument(docId, { content: newMarkdown });

        return { success: true, message: "Content inserted" };
      },
    }),
    sys_doc_replace: createTool({
      description: "Replace existing content with new content.",
      parameters: {
        type: "object",
        properties: {
          oldText: {
            type: "string",
            description: "Text to replace",
          },
          newText: {
            type: "string",
            description: "Replacement text",
          },
        },
        required: ["oldText", "newText"],
      },
      execute: async ({
        oldText,
        newText,
      }: {
        oldText: string;
        newText: string;
      }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }

        // Simple text replacement for Phase 5
        const newContent = doc.content.replace(oldText, newText);
        await writeDocument(docId, { content: newContent });

        return { success: true, message: "Content replaced" };
      },
    }),
    sys_doc_delete: createTool({
      description: "Delete content from the document.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to delete",
          },
        },
        required: ["text"],
      },
      execute: async ({ text }: { text: string }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }

        const newContent = doc.content.replace(text, "");
        await writeDocument(docId, { content: newContent });

        return { success: true, message: "Content deleted" };
      },
    }),
    sys_doc_get_selection: createTool({
      description: "Get the user's currently selected text in the document.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () => {
        // Phase 5: Return empty (requires client state)
        return { selection: "" };
      },
    }),
    sys_doc_get_properties: createTool({
      description: "Get all document properties (frontmatter metadata).",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }
        return { properties: doc.properties };
      },
    }),
    sys_doc_set_property: createTool({
      description: "Update a document property (frontmatter field).",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Property key",
          },
          value: {
            type: "string",
            description: "Property value",
          },
        },
        required: ["key", "value"],
      },
      execute: async ({
        key,
        value,
      }: {
        key: string;
        value: string;
      }) => {
        const doc = await readDocument(docId);
        if (!doc) {
          return { error: "Document not found" };
        }

        await writeDocument(docId, {
          properties: { ...doc.properties, [key]: value },
        });

        return { success: true, message: `Property ${key} updated` };
      },
    }),
  };
}
