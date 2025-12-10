// Frontmatter utilities for document parsing

import matter from "gray-matter";
import type { DocumentFrontmatter } from "./types";

export function parseFrontmatter(content: string): {
  frontmatter: DocumentFrontmatter;
  content: string;
} {
  const { data, content: bodyContent } = matter(content);
  return {
    frontmatter: data as DocumentFrontmatter,
    content: bodyContent,
  };
}

export function stringifyWithFrontmatter(
  content: string,
  frontmatter: DocumentFrontmatter
): string {
  return matter.stringify(content, frontmatter);
}

export function updateFrontmatter(
  existingFrontmatter: DocumentFrontmatter,
  updates: Partial<DocumentFrontmatter>
): DocumentFrontmatter {
  return {
    ...existingFrontmatter,
    ...updates,
    updated: new Date().toISOString(),
  };
}
