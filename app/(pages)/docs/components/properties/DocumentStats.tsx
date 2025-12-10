"use client";

import { useDocsStore } from "../../store";
import { formatDistanceToNow } from "date-fns";

export function DocumentStats() {
  const document = useDocsStore((state) => state.document);
  const content = useDocsStore((state) => state.content);

  if (!document) return null;

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Statistics</h4>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Words</p>
          <p className="font-medium">{wordCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Characters</p>
          <p className="font-medium">{charCount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Reading time</p>
          <p className="font-medium">{readingTime} min</p>
        </div>
        <div>
          <p className="text-muted-foreground">Headings</p>
          <p className="font-medium">
            {useDocsStore.getState().headings.length}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Created</span>
          <span>
            {formatDistanceToNow(new Date(document.frontmatter.created), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last modified</span>
          <span>
            {formatDistanceToNow(new Date(document.frontmatter.updated), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
