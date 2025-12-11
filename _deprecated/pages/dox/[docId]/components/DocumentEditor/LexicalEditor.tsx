"use client";

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { SlashCommandMenuPlugin } from "./SlashCommandMenu";
import { Toolbar } from "./Toolbar";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { $getRoot, $createParagraphNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState } from "lexical";
import { useDocsStore } from "../../store";

const editorTheme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-3xl font-bold mb-4 mt-6",
    h2: "text-2xl font-bold mb-3 mt-5",
    h3: "text-xl font-bold mb-2 mt-4",
  },
  list: {
    ul: "list-disc pl-6 mb-2",
    ol: "list-decimal pl-6 mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-gray-300 pl-4 italic my-4",
  code: "bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono text-sm",
  codeHighlight: {
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-red-600",
    builtin: "text-yellow-600",
    cdata: "text-gray-600",
    char: "text-green-600",
    class: "text-blue-600",
    comment: "text-gray-500 italic",
    constant: "text-red-600",
    deleted: "text-red-600",
    doctype: "text-gray-600",
    entity: "text-orange-600",
    function: "text-blue-600",
    important: "text-red-600",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-yellow-600",
    number: "text-red-600",
    operator: "text-gray-600",
    prolog: "text-gray-600",
    property: "text-blue-600",
    punctuation: "text-gray-600",
    regex: "text-green-600",
    selector: "text-green-600",
    string: "text-green-600",
    symbol: "text-yellow-600",
    tag: "text-red-600",
    url: "text-blue-600",
    variable: "text-orange-600",
  },
};

const initialConfig = {
  namespace: "DoxEditor",
  theme: editorTheme,
  onError: (error: Error) => {
    console.error("[Lexical] Error:", error);
  },
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
};

interface LexicalEditorProps {
  initialMarkdown?: string;
}

/**
 * Plugin to load initial Markdown content into editor
 * Only loads once when markdown is first provided
 */
function InitialContentPlugin({ markdown }: { markdown?: string }) {
  const [editor] = useLexicalComposerContext();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (markdown && !hasLoaded) {
      editor.update(() => {
        const root = $getRoot();
        root.clear(); // CRITICAL: Must clear first
        if (markdown.trim()) {
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        } else {
          // Empty document - add empty paragraph
          root.append($createParagraphNode());
        }
      });
      setHasLoaded(true);
    }
  }, [editor, markdown, hasLoaded]);

  return null;
}

/**
 * Plugin to sync editor changes to store
 */
function OnChangeSyncPlugin() {
  const [editor] = useLexicalComposerContext();
  const store = useDocsStore();

  useEffect(() => {
    // Initialize editor in store
    store.initializeEditor(editor);
  }, [editor, store]);

  const handleChange = (editorState: EditorState) => {
    // Mark as dirty when content changes
    store.setDirty(true);
  };

  return <OnChangePlugin onChange={handleChange} />;
}

export function LexicalEditor({ initialMarkdown }: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col h-full">
        <Toolbar />
        <div className="flex-1 overflow-auto relative">
          <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="outline-none min-h-[400px] px-6 py-4 prose prose-slate dark:prose-invert max-w-none focus:outline-none" 
              aria-label="Document editor"
            />
          }
          placeholder={
            <div className="absolute top-4 left-6 text-muted-foreground pointer-events-none">
              Start writing, or press / for commands...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <SlashCommandMenuPlugin />
          <InitialContentPlugin markdown={initialMarkdown} />
          <OnChangeSyncPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
