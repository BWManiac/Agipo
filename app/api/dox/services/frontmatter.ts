/**
 * Frontmatter Service
 * 
 * Handles YAML frontmatter parsing and serialization for documents.
 */

import matter from "gray-matter";
import yaml from "js-yaml";

export interface FrontmatterData {
  title?: string;
  created?: string;
  updated?: string;
  tags?: string[];
  [key: string]: unknown;
}

/**
 * Parse Markdown with YAML frontmatter.
 * 
 * @param markdown - Markdown string with frontmatter
 * @returns Object with frontmatter data and content
 */
export function parseFrontmatter(markdown: string): {
  frontmatter: FrontmatterData;
  content: string;
} {
  const parsed = matter(markdown, {
    engines: {
      yaml: (str) => yaml.load(str) as Record<string, unknown>,
    },
  });

  return {
    frontmatter: (parsed.data || {}) as FrontmatterData,
    content: parsed.content,
  };
}

/**
 * Serialize frontmatter and content to Markdown string.
 * 
 * @param frontmatter - Frontmatter object
 * @param content - Markdown content
 * @returns Markdown string with frontmatter
 */
export function serializeFrontmatter(
  frontmatter: FrontmatterData,
  content: string
): string {
  const yamlStr = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: -1,
  });

  return `---\n${yamlStr}---\n${content}`;
}
