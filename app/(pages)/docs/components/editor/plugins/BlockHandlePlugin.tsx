"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  $createParagraphNode,
  $copyNode,
  LexicalNode,
  NodeKey,
} from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { $isListNode, $isListItemNode } from "@lexical/list";
import { $isCodeNode } from "@lexical/code";
import { $isQuoteNode } from "@lexical/rich-text";
import { GripVertical, Plus, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BlockHandleProps {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
}

function BlockHandle({ editor }: BlockHandleProps) {
  const [hoveredBlockKey, setHoveredBlockKey] = useState<NodeKey | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const updatePosition = useCallback((element: HTMLElement) => {
    const editorRoot = editor.getRootElement();
    if (!editorRoot) return;

    const editorRect = editorRoot.getBoundingClientRect();
    const blockRect = element.getBoundingClientRect();

    setPosition({
      top: blockRect.top - editorRect.top + editorRoot.scrollTop,
      left: -40,
    });
  }, [editor]);

  useEffect(() => {
    const editorRoot = editor.getRootElement();
    if (!editorRoot) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isMenuOpen) return;

      const target = e.target as HTMLElement;

      // Find the closest block-level element
      const blockElement = target.closest(
        "p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, hr"
      );

      if (blockElement && editorRoot.contains(blockElement)) {
        // Get the Lexical node key from the element
        const key = (blockElement as HTMLElement).getAttribute("data-lexical-node-key");
        if (key && key !== hoveredBlockKey) {
          setHoveredBlockKey(key);
          updatePosition(blockElement as HTMLElement);
        }
      } else if (!isMenuOpen) {
        setHoveredBlockKey(null);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (!isMenuOpen) {
        setHoveredBlockKey(null);
      }
    };

    editorRoot.addEventListener("mousemove", handleMouseMove);
    editorRoot.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      editorRoot.removeEventListener("mousemove", handleMouseMove);
      editorRoot.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [editor, hoveredBlockKey, isMenuOpen, updatePosition]);

  const handleDelete = useCallback(() => {
    if (!hoveredBlockKey) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlockKey);
      if (node) {
        node.remove();
      }
    });
    setHoveredBlockKey(null);
    setIsMenuOpen(false);
  }, [editor, hoveredBlockKey]);

  const handleDuplicate = useCallback(() => {
    if (!hoveredBlockKey) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlockKey);
      if (node) {
        const clone = $copyNode(node);
        node.insertAfter(clone);
      }
    });
    setIsMenuOpen(false);
  }, [editor, hoveredBlockKey]);

  const handleMoveUp = useCallback(() => {
    if (!hoveredBlockKey) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlockKey);
      if (node) {
        const previousSibling = node.getPreviousSibling();
        if (previousSibling) {
          previousSibling.insertBefore(node);
        }
      }
    });
    setIsMenuOpen(false);
  }, [editor, hoveredBlockKey]);

  const handleMoveDown = useCallback(() => {
    if (!hoveredBlockKey) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlockKey);
      if (node) {
        const nextSibling = node.getNextSibling();
        if (nextSibling) {
          nextSibling.insertAfter(node);
        }
      }
    });
    setIsMenuOpen(false);
  }, [editor, hoveredBlockKey]);

  const handleAddBlockBelow = useCallback(() => {
    if (!hoveredBlockKey) return;

    editor.update(() => {
      const node = $getNodeByKey(hoveredBlockKey);
      if (node) {
        const { $createParagraphNode } = require("lexical");
        const newParagraph = $createParagraphNode();
        node.insertAfter(newParagraph);
        newParagraph.selectEnd();
      }
    });
    setIsMenuOpen(false);
  }, [editor, hoveredBlockKey]);

  if (!hoveredBlockKey) return null;

  const editorRoot = editor.getRootElement();
  if (!editorRoot) return null;

  return createPortal(
    <div
      className="absolute flex items-center gap-0.5 transition-opacity duration-150 opacity-50 hover:opacity-100"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleAddBlockBelow}
        title="Add block below"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-grab"
            title="Drag to reorder or click for options"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMoveUp}>
            <ArrowUp className="h-4 w-4 mr-2" />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleMoveDown}>
            <ArrowDown className="h-4 w-4 mr-2" />
            Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>,
    editorRoot.parentElement || document.body
  );
}

export function BlockHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return <BlockHandle editor={editor} />;
}
