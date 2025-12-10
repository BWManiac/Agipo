"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import { editorTheme } from "./themes/editorTheme";
import { editorNodes } from "./nodes";
import { EditorContent } from "./EditorContent";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { MarkdownPlugin } from "./plugins/MarkdownPlugin";
import { OnChangePlugin } from "./plugins/OnChangePlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { KeyboardShortcutsPlugin } from "./plugins/KeyboardShortcutsPlugin";
import { SlashCommandPlugin } from "./plugins/SlashCommandPlugin";
import { BlockHandlePlugin } from "./plugins/BlockHandlePlugin";

interface EditorContainerProps {
  initialContent: string;
}

export function EditorContainer({ initialContent }: EditorContainerProps) {
  const initialConfig = {
    namespace: "AgipoDocs",
    theme: editorTheme,
    nodes: editorNodes,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-auto">
          <RichTextPlugin
            contentEditable={<EditorContent />}
            placeholder={<EditorPlaceholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Core Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

        {/* Custom Plugins */}
        <MarkdownPlugin initialContent={initialContent} />
        <OnChangePlugin />
        <AutoSavePlugin debounceMs={1500} />
        <FloatingToolbarPlugin />
        <KeyboardShortcutsPlugin />
        <SlashCommandPlugin />
        <BlockHandlePlugin />
      </div>
    </LexicalComposer>
  );
}

function EditorPlaceholder() {
  return (
    <div className="absolute top-0 left-0 pointer-events-none text-muted-foreground px-16 py-12">
      Start writing, or press / for commands...
    </div>
  );
}
