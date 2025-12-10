// Document Tools for Agent Editing

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDocument, updateDocument } from "../../../services";

export function createDocTools(docId: string) {
  // Tool: Read document content
  const sysDocRead = createTool({
    id: "sys_doc_read",
    description: "Read the full content of the current document",
    inputSchema: z.object({}),
    execute: async () => {
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }
      return {
        title: doc.frontmatter.title,
        content: doc.content,
        wordCount: doc.content.trim().split(/\s+/).filter(Boolean).length,
      };
    },
  });

  // Tool: Get specific section by heading
  const sysDocGetSection = createTool({
    id: "sys_doc_get_section",
    description: "Get content of a specific heading section",
    inputSchema: z.object({
      heading: z.string().describe("The heading text to find (e.g., '## Introduction')"),
    }),
    execute: async ({ context }) => {
      const { heading } = context;
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }

      const lines = doc.content.split("\n");
      let startIndex = -1;
      let endIndex = lines.length;
      let headingLevel = 0;

      // Find the heading
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();

          if (startIndex === -1 && text.toLowerCase().includes(heading.toLowerCase())) {
            startIndex = i;
            headingLevel = level;
          } else if (startIndex !== -1 && level <= headingLevel) {
            endIndex = i;
            break;
          }
        }
      }

      if (startIndex === -1) {
        return { found: false, heading, content: null };
      }

      const sectionContent = lines.slice(startIndex, endIndex).join("\n");
      return {
        found: true,
        heading: lines[startIndex],
        content: sectionContent,
        startLine: startIndex + 1,
        endLine: endIndex,
      };
    },
  });

  // Tool: Insert content
  const sysDocInsert = createTool({
    id: "sys_doc_insert",
    description: "Insert text into the document at a specific position",
    inputSchema: z.object({
      content: z.string().describe("The Markdown text to insert"),
      position: z.enum(["start", "end", "after_heading"]).describe("Where to insert"),
      afterHeading: z.string().optional().describe("Heading to insert after (if position is after_heading)"),
    }),
    execute: async ({ context }) => {
      const { content, position, afterHeading } = context;
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }

      let newContent: string;
      const lines = doc.content.split("\n");

      if (position === "start") {
        newContent = content + "\n\n" + doc.content;
      } else if (position === "end") {
        newContent = doc.content + "\n\n" + content;
      } else if (position === "after_heading" && afterHeading) {
        let insertIndex = -1;
        let headingLevel = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const match = line.match(/^(#{1,6})\s+(.+)$/);
          if (match) {
            const text = match[2].trim();
            if (text.toLowerCase().includes(afterHeading.toLowerCase())) {
              headingLevel = match[1].length;
              // Find the end of this section
              for (let j = i + 1; j < lines.length; j++) {
                const nextMatch = lines[j].match(/^(#{1,6})\s+/);
                if (nextMatch && nextMatch[1].length <= headingLevel) {
                  insertIndex = j;
                  break;
                }
              }
              if (insertIndex === -1) {
                insertIndex = lines.length;
              }
              break;
            }
          }
        }

        if (insertIndex === -1) {
          // Heading not found, append to end
          newContent = doc.content + "\n\n" + content;
        } else {
          lines.splice(insertIndex, 0, "\n" + content);
          newContent = lines.join("\n");
        }
      } else {
        newContent = doc.content + "\n\n" + content;
      }

      await updateDocument(docId, { content: newContent });

      return {
        success: true,
        position,
        insertedContent: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      };
    },
  });

  // Tool: Replace content
  const sysDocReplace = createTool({
    id: "sys_doc_replace",
    description: "Replace text in the document",
    inputSchema: z.object({
      search: z.string().describe("Text to find and replace"),
      replacement: z.string().describe("New text to insert"),
      replaceAll: z.boolean().optional().describe("Replace all occurrences (default: false)"),
    }),
    execute: async ({ context }) => {
      const { search, replacement, replaceAll } = context;
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }

      let newContent: string;
      let replacements: number;

      if (replaceAll) {
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        const matches = doc.content.match(regex);
        replacements = matches ? matches.length : 0;
        newContent = doc.content.replace(regex, replacement);
      } else {
        const index = doc.content.indexOf(search);
        if (index === -1) {
          return { success: false, replacements: 0, message: "Text not found" };
        }
        newContent = doc.content.substring(0, index) + replacement + doc.content.substring(index + search.length);
        replacements = 1;
      }

      if (replacements === 0) {
        return { success: false, replacements: 0, message: "Text not found" };
      }

      await updateDocument(docId, { content: newContent });

      return {
        success: true,
        replacements,
      };
    },
  });

  // Tool: Get document properties
  const sysDocGetProperties = createTool({
    id: "sys_doc_get_properties",
    description: "Get document properties (frontmatter)",
    inputSchema: z.object({}),
    execute: async () => {
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }

      return {
        title: doc.frontmatter.title,
        description: doc.frontmatter.description,
        tags: doc.frontmatter.tags,
        created: doc.frontmatter.created,
        updated: doc.frontmatter.updated,
      };
    },
  });

  // Tool: Set document property
  const sysDocSetProperty = createTool({
    id: "sys_doc_set_property",
    description: "Update a document property",
    inputSchema: z.object({
      property: z.enum(["title", "description", "tags"]).describe("Property to update"),
      value: z.union([z.string(), z.array(z.string())]).describe("New value"),
    }),
    execute: async ({ context }) => {
      const { property, value } = context;
      const doc = await getDocument(docId);
      if (!doc) {
        return { error: "Document not found" };
      }

      const updates: Record<string, unknown> = {};

      if (property === "title" && typeof value === "string") {
        updates.title = value;
      } else if (property === "description" && typeof value === "string") {
        updates.description = value;
      } else if (property === "tags" && Array.isArray(value)) {
        updates.tags = value;
      } else {
        return { error: "Invalid property or value type" };
      }

      await updateDocument(docId, updates as { title?: string; description?: string; tags?: string[] });

      return {
        success: true,
        property,
        newValue: value,
      };
    },
  });

  return {
    sys_doc_read: sysDocRead,
    sys_doc_get_section: sysDocGetSection,
    sys_doc_insert: sysDocInsert,
    sys_doc_replace: sysDocReplace,
    sys_doc_get_properties: sysDocGetProperties,
    sys_doc_set_property: sysDocSetProperty,
  };
}
