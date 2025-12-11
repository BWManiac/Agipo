"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $getSelection, $isRangeSelection } from "lexical";
import { $createHeadingNode, HeadingTagType } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode } from "lexical";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import { $createQuoteNode } from "@lexical/rich-text";
import { useCallback, useMemo, useState } from "react";
import { Heading1, Heading2, Heading3, List, ListOrdered, Code, Quote, Type } from "lucide-react";
import * as ReactDOM from "react-dom";

interface SlashCommandOption {
  title: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: (editor: any) => void;
}

class SlashCommand extends MenuOption {
  title: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: (editor: any) => void;

  constructor(
    title: string,
    icon: React.ReactNode,
    keywords: string[],
    onSelect: (editor: any) => void
  ) {
    super(title);
    this.title = title;
    this.icon = icon;
    this.keywords = keywords;
    this.onSelect = onSelect;
  }
}

const SLASH_COMMANDS: SlashCommand[] = [
  new SlashCommand(
    "Heading 1",
    <Heading1 className="w-4 h-4" />,
    ["h1", "heading1", "title"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h1");
          heading.append($createTextNode(""));
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommand(
    "Heading 2",
    <Heading2 className="w-4 h-4" />,
    ["h2", "heading2", "subtitle"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h2");
          heading.append($createTextNode(""));
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommand(
    "Heading 3",
    <Heading3 className="w-4 h-4" />,
    ["h3", "heading3"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const heading = $createHeadingNode("h3");
          heading.append($createTextNode(""));
          selection.insertNodes([heading]);
        }
      });
    }
  ),
  new SlashCommand(
    "Paragraph",
    <Type className="w-4 h-4" />,
    ["p", "paragraph", "text"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(""));
          selection.insertNodes([paragraph]);
        }
      });
    }
  ),
  new SlashCommand(
    "Bullet List",
    <List className="w-4 h-4" />,
    ["ul", "bullet", "list"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const listNode = $createListNode("bullet");
          const listItem = $createListItemNode();
          listItem.append($createTextNode(""));
          listNode.append(listItem);
          selection.insertNodes([listNode]);
        }
      });
    }
  ),
  new SlashCommand(
    "Numbered List",
    <ListOrdered className="w-4 h-4" />,
    ["ol", "number", "ordered"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const listNode = $createListNode("number");
          const listItem = $createListItemNode();
          listItem.append($createTextNode(""));
          listNode.append(listItem);
          selection.insertNodes([listNode]);
        }
      });
    }
  ),
  new SlashCommand(
    "Code Block",
    <Code className="w-4 h-4" />,
    ["code", "snippet"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const codeNode = $createCodeNode();
          codeNode.append($createTextNode(""));
          selection.insertNodes([codeNode]);
        }
      });
    }
  ),
  new SlashCommand(
    "Quote",
    <Quote className="w-4 h-4" />,
    ["quote", "blockquote"],
    (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const quoteNode = $createQuoteNode();
          quoteNode.append($createTextNode(""));
          selection.insertNodes([quoteNode]);
        }
      });
    }
  ),
];

function SlashCommandMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: SlashCommand;
}) {
  return (
    <li
      key={option.key}
      id={`slash-command-${index}`}
      role="option"
      aria-selected={isSelected}
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="text-muted-foreground">{option.icon}</div>
      <div>
        <div className="font-medium">{option.title}</div>
      </div>
    </li>
  );
}

export function SlashCommandMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForSlashMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(() => {
    if (!queryString) {
      return SLASH_COMMANDS;
    }
    const lowerQuery = queryString.toLowerCase();
    return SLASH_COMMANDS.filter(
      (option) =>
        option.title.toLowerCase().includes(lowerQuery) ||
        option.keywords.some((kw) => kw.includes(lowerQuery))
    );
  }, [queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: SlashCommand,
      nodeToRemove: any,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(editor);
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForSlashMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (!anchorElementRef.current || options.length === 0) {
          return null;
        }

        return ReactDOM.createPortal(
          <div className="fixed z-50 bg-popover border rounded-lg shadow-lg p-1 min-w-[200px] max-h-[300px] overflow-auto">
            <ul role="listbox" className="list-none m-0 p-0">
              {options.map((option, index) => (
                <SlashCommandMenuItem
                  key={option.key}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => {
                    setHighlightedIndex(index);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                  option={option}
                />
              ))}
            </ul>
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
