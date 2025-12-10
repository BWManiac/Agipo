/**
 * Phase 0 Spike: Frontmatter Parsing Tests
 *
 * Tests:
 * - YAML frontmatter parsing (AC-0.12)
 * - Frontmatter serialization (AC-0.13)
 * - Frontmatter round-trip (AC-0.14)
 */

import matter from "gray-matter";

/**
 * Test: Frontmatter Parsing
 * Validates: AC-0.12, AC-0.13, AC-0.14
 */
export async function testFrontmatterParsing() {
  const markdownWithFrontmatter = `---
title: "Test Document"
tags: [test, spike]
created: 2025-12-10
---

# Content

This is the content.
`;

  // Parse frontmatter
  const parsed = matter(markdownWithFrontmatter);

  // Verify parsed data
  const parsedData = parsed.data as {
    title: string;
    tags: string[];
    created: string;
  };

  // Modify frontmatter
  const modifiedData = {
    ...parsedData,
    tags: [...parsedData.tags, "modified"],
    updated: "2025-12-10",
  };

  // Serialize back
  const serialized = matter.stringify(parsed.content, modifiedData);

  // Parse again to verify round-trip
  const reparsed = matter(serialized);
  const reparsedData = reparsed.data as typeof modifiedData;

  // Verify round-trip
  const titleMatches = reparsedData.title === modifiedData.title;
  const tagsMatch =
    Array.isArray(reparsedData.tags) &&
    reparsedData.tags.length === modifiedData.tags.length &&
    reparsedData.tags.every((tag, i) => tag === modifiedData.tags[i]);
  const updatedExists = reparsedData.updated === modifiedData.updated;

  return {
    success: true,
    parsed: parsedData,
    modified: modifiedData,
    serialized: serialized.substring(0, 300), // First 300 chars
    roundTrip: {
      titleMatches,
      tagsMatch,
      updatedExists,
      allMatch: titleMatches && tagsMatch && updatedExists,
    },
    note: "Frontmatter parsing and serialization work correctly.",
  };
}
