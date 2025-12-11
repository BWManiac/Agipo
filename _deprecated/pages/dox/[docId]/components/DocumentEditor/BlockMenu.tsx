"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $copyNode } from "lexical";
import { $getRoot } from "lexical";
import type { ElementNode } from "lexical";

interface BlockMenuProps {
  children: React.ReactNode;
  blockId?: string;
}

/**
 * Block Context Menu
 * 
 * Right-click menu for block operations (duplicate, delete, turn into).
 * Phase 3: Basic implementation (full functionality in future)
 */
export function BlockMenu({ children, blockId }: BlockMenuProps) {
  const [editor] = useLexicalComposerContext();

  const handleDelete = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const root = $getRoot();
        const index = root.getChildren().indexOf(anchorNode);
        if (index !== -1) {
          root.splice(index, 1, []); // Empty array for deletion
        }
      }
    });
  };

  const handleDuplicate = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const root = $getRoot();
        const index = root.getChildren().indexOf(anchorNode);
        if (index !== -1 && anchorNode.getType() !== "root") {
          const elementNode = anchorNode as ElementNode;
          // Clone the node using $copyNode
          const clonedNode = $copyNode(elementNode);
          root.splice(index + 1, 0, [clonedNode as ElementNode]);
        }
      }
    });
  };

  const handleMoveUp = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const root = $getRoot();
        const index = root.getChildren().indexOf(anchorNode);
        if (index > 0) {
          const block = root.getChildAtIndex(index);
          if (block) {
            root.splice(index, 1, []); // Remove
            root.splice(index - 1, 0, [block]); // Insert above
          }
        }
      }
    });
  };

  const handleMoveDown = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const root = $getRoot();
        const index = root.getChildren().indexOf(anchorNode);
        const total = root.getChildrenSize();
        if (index < total - 1) {
          const block = root.getChildAtIndex(index);
          if (block) {
            root.splice(index, 1, []); // Remove
            root.splice(index + 1, 0, [block]); // Insert below
          }
        }
      }
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleMoveUp}>
          <ArrowUp className="w-4 h-4 mr-2" />
          Move Up
        </ContextMenuItem>
        <ContextMenuItem onClick={handleMoveDown}>
          <ArrowDown className="w-4 h-4 mr-2" />
          Move Down
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
