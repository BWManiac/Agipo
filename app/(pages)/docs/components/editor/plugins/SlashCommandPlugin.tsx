"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  TextNode,
} from "lexical";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import { $createQuoteNode } from "@lexical/rich-text";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

class SlashCommandOption extends MenuOption {
  title: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void;

  constructor(
    title: string,
    icon: React.ReactNode,
    keywords: string[],
    onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void
  ) {
    super(title);
    this.title = title;
    this.icon = icon;
    this.keywords = keywords;
    this.onSelect = onSelect;
  }
}

const SLASH_COMMANDS: SlashCommandOption[] = [
  new SlashCommandOption(
    "Heading 1",
    <Heading1 className="h-4 w-4" />,
    ["h1", "heading", "title"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h1");
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Heading 2",
    <Heading2 className="h-4 w-4" />,
    ["h2", "heading", "subtitle"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h2");
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Heading 3",
    <Heading3 className="h-4 w-4" />,
    ["h3", "heading"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h3");
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Heading 4",
    <Heading4 className="h-4 w-4" />,
    ["h4", "heading"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h4");
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Bullet List",
    <List className="h-4 w-4" />,
    ["bullet", "list", "ul", "unordered"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const list = $createListNode("bullet");
          const item = $createListItemNode();
          list.append(item);
          selection.insertNodes([list]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Numbered List",
    <ListOrdered className="h-4 w-4" />,
    ["numbered", "list", "ol", "ordered"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const list = $createListNode("number");
          const item = $createListItemNode();
          list.append(item);
          selection.insertNodes([list]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Code Block",
    <Code className="h-4 w-4" />,
    ["code", "snippet", "pre"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const code = $createCodeNode();
          selection.insertNodes([code]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Quote",
    <Quote className="h-4 w-4" />,
    ["quote", "blockquote"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const quote = $createQuoteNode();
          selection.insertNodes([quote]);
        }
      });
    }
  ),
  new SlashCommandOption(
    "Divider",
    <Minus className="h-4 w-4" />,
    ["divider", "hr", "horizontal", "line"],
    (editor) => {
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    }
  ),
  new SlashCommandOption(
    "Paragraph",
    <Type className="h-4 w-4" />,
    ["paragraph", "text", "normal"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const paragraph = $createParagraphNode();
          selection.insertNodes([paragraph]);
        }
      });
    }
  ),
];

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(() => {
    if (queryString === null) return SLASH_COMMANDS;
    const lowerQuery = queryString.toLowerCase();
    return SLASH_COMMANDS.filter(
      (option) =>
        option.title.toLowerCase().includes(lowerQuery) ||
        option.keywords.some((kw) => kw.includes(lowerQuery))
    );
  }, [queryString]);

  const onSelectOption = useCallback(
    (
      option: SlashCommandOption,
      textNodeContainingQuery: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        // Remove the slash command text
        if (textNodeContainingQuery) {
          textNodeContainingQuery.remove();
        }
      });
      option.onSelect(editor);
      closeMenu();
    },
    [editor]
  );

  if (!isMounted) return null;

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null;

        return createPortal(
          <div className="fixed z-50 bg-background border rounded-lg shadow-lg py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
            {options.map((option, index) => (
              <div
                key={option.title}
                className={cn(
                  "px-3 py-2 cursor-pointer flex items-center gap-3",
                  selectedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => selectOptionAndCleanUp(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="w-8 h-8 flex items-center justify-center bg-muted rounded text-muted-foreground">
                  {option.icon}
                </span>
                <span className="font-medium">{option.title}</span>
              </div>
            ))}
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
