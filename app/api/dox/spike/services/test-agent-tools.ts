/**
 * Phase 0 Spike: Agent Tool Patterns Tests
 *
 * Tests:
 * - sys_doc_insert pattern (AC-0.15)
 * - sys_doc_replace pattern (AC-0.16)
 * - sys_doc_delete pattern (AC-0.17)
 *
 * Note: These simulate agent tool calls. The actual agent tools will
 * be implemented in Phase 5, but this validates the block manipulation
 * patterns that tools will use.
 */

import { createEditor } from "lexical";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  type ElementNode,
} from "lexical";
import { HeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";

/**
 * Test: Agent Tool Patterns
 * Validates: AC-0.15, AC-0.16, AC-0.17
 */
export async function testAgentToolPatterns() {
  const editor = createEditor({
    namespace: "agent-tool-test",
    nodes: [HeadingNode, ListNode, ListItemNode],
  });

  const toolCalls: Array<{ tool: string; success: boolean; error?: string }> = [];

  // Initial content
  editor.update(() => {
    const root = $getRoot();
    const p1 = $createParagraphNode();
    p1.append($createTextNode("Original content"));
    root.append(p1);

    const p2 = $createParagraphNode();
    p2.append($createTextNode("Paragraph 2"));
    root.append(p2);
  });

  // Simulate sys_doc_insert
  try {
    editor.update(() => {
      const root = $getRoot();
      const newBlock = $createParagraphNode();
      newBlock.append($createTextNode("Agent inserted this"));
      root.append(newBlock);
    });
    toolCalls.push({ tool: "sys_doc_insert", success: true });
  } catch (error) {
    toolCalls.push({
      tool: "sys_doc_insert",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Simulate sys_doc_replace
  try {
    editor.update(() => {
      const root = $getRoot();
      const block = root.getChildAtIndex(0);
      if (block && block.getType() === "paragraph") {
        const paragraphNode = block as ElementNode;
        paragraphNode.clear();
        paragraphNode.append($createTextNode("Agent replaced this"));
      } else {
        throw new Error("Block not found or wrong type");
      }
    });
    toolCalls.push({ tool: "sys_doc_replace", success: true });
  } catch (error) {
    toolCalls.push({
      tool: "sys_doc_replace",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Simulate sys_doc_delete
  try {
    editor.update(() => {
      const root = $getRoot();
      if (root.getChildrenSize() > 1) {
        root.splice(1, 1, []);
      } else {
        throw new Error("No blocks to delete");
      }
    });
    toolCalls.push({ tool: "sys_doc_delete", success: true });
  } catch (error) {
    toolCalls.push({
      tool: "sys_doc_delete",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test inserting Markdown content (agent will send Markdown)
  try {
    editor.update(() => {
      const root = $getRoot();
      // Convert agent's Markdown to blocks
      const markdownContent = "## Agent Heading\n\nAgent paragraph content.";
      const tempEditor = createEditor({
        namespace: "temp",
        nodes: [HeadingNode, ListNode, ListItemNode],
      });
      tempEditor.update(() => {
        $convertFromMarkdownString(markdownContent, TRANSFORMERS);
      });
      // Get the blocks from temp editor and append
      tempEditor.getEditorState().read(() => {
        const tempRoot = $getRoot();
        const children = tempRoot.getChildren();
        root.append(...children);
      });
    });
    toolCalls.push({ tool: "sys_doc_insert_markdown", success: true });
  } catch (error) {
    toolCalls.push({
      tool: "sys_doc_insert_markdown",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Get final state (must read synchronously from editor state)
  let finalContent = "";
  const editorState = editor.getEditorState();
  editorState.read(() => {
    const root = $getRoot();
    finalContent = root.getTextContent();
  });

  const allSuccess = toolCalls.every((call) => call.success);

  return {
    success: allSuccess,
    toolCalls,
    finalContent,
    note: allSuccess
      ? "Agent tool patterns work correctly."
      : "Some agent tool patterns failed. Check errors.",
  };
}
