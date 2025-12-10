"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../../store";

interface TagEditorProps {
  docId: string;
}

export function TagEditor({ docId }: TagEditorProps) {
  const document = useDocsStore((state) => state.document);
  const setDocument = useDocsStore((state) => state.setDocument);
  const [tags, setTags] = useState<string[]>(document?.frontmatter.tags || []);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (document) {
      setTags(document.frontmatter.tags || []);
    }
  }, [document]);

  const saveTags = async (updatedTags: string[]) => {
    if (!document) return;

    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: updatedTags }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocument(data.document);
      }
    } catch (error) {
      console.error("Failed to update tags:", error);
      setTags(document.frontmatter.tags || []);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || tags.includes(tag)) {
      setNewTag("");
      return;
    }

    const updatedTags = [...tags, tag];
    setTags(updatedTags);
    setNewTag("");
    saveTags(updatedTags);
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    saveTags(updatedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>

      {/* Tag list */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add tag input */}
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={addTag}
          disabled={!newTag.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
