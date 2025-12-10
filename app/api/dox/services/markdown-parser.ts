/**
 * Markdown Parser Service
 * 
 * Converts between Lexical editor state and Markdown strings.
 * 
 * CRITICAL PATTERNS (from Phase 0):
 * - MUST call root.clear() before $convertFromMarkdownString() or content appends
 * - MUST use editor.update() for serialization, NOT editor.getEditorState().read()
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

/**
 * Create a Lexical editor instance with all required nodes.
 */
function createLexicalEditor() {
  return createEditor({
    namespace: "dox-editor",
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

/**
 * Convert Markdown string to Lexical editor state JSON.
 * 
 * @param markdown - Markdown string
 * @returns Lexical editor state JSON
 */
export function markdownToLexical(markdown: string): string {
  const editor = createLexicalEditor();

  // CRITICAL: Must clear root before parsing or content appends
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    $convertFromMarkdownString(markdown, TRANSFORMERS);
  });

  const editorState = editor.getEditorState();
  return JSON.stringify(editorState.toJSON());
}

/**
 * Convert Lexical editor state JSON to Markdown string.
 * 
 * @param lexicalStateJson - Lexical editor state JSON string
 * @returns Markdown string
 */
export function lexicalToMarkdown(lexicalStateJson: string): string {
  const editor = createLexicalEditor();
  const editorState = editor.parseEditorState(lexicalStateJson);

  // CRITICAL: Must use editor.update() for serialization, NOT read()
  let markdown = "";
  editor.setEditable(false);
  editor.setEditorState(editorState);
  editor.update(() => {
    markdown = $convertToMarkdownString(TRANSFORMERS);
  });

  return markdown;
}
