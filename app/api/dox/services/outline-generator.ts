/**
 * Outline Generator Service
 * 
 * Extracts heading structure from Markdown for outline sidebar.
 */

import { remark } from "remark";
import { visit } from "unist-util-visit";
import type { Heading } from "mdast";

export interface OutlineItem {
  level: number;
  text: string;
  id: string;
  position: number;
}

/**
 * Generate outline from Markdown content.
 * 
 * @param markdown - Markdown string
 * @returns Array of outline items (headings)
 */
export async function generateOutline(markdown: string): Promise<OutlineItem[]> {
  const tree = await remark().parse(markdown);
  const outline: OutlineItem[] = [];
  let position = 0;

  visit(tree, "heading", (node: Heading) => {
    const text = node.children
      .filter((child) => child.type === "text")
      .map((child: any) => child.value)
      .join("");

    if (text) {
      outline.push({
        level: node.depth,
        text,
        id: `heading-${outline.length}`,
        position,
      });
    }
    position++;
  });

  return outline;
}
