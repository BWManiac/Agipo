// Lexical Editor Theme - Tailwind CSS classes

import type { EditorThemeClasses } from "lexical";

export const editorTheme: EditorThemeClasses = {
  // Root
  root: "relative",

  // Text formatting
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400",
  },

  // Headings
  heading: {
    h1: "text-4xl font-bold mt-8 mb-4",
    h2: "text-3xl font-semibold mt-6 mb-3",
    h3: "text-2xl font-semibold mt-5 mb-2",
    h4: "text-xl font-semibold mt-4 mb-2",
    h5: "text-lg font-semibold mt-3 mb-1",
    h6: "text-base font-semibold mt-3 mb-1",
  },

  // Paragraphs
  paragraph: "mb-4 leading-relaxed",

  // Lists
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-6 mb-4",
    ul: "list-disc ml-6 mb-4",
    listitem: "mb-1",
    listitemChecked: "line-through text-muted-foreground",
    listitemUnchecked: "",
  },

  // Quotes
  quote: "border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground my-4",

  // Code
  code: "block bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto my-4",
  codeHighlight: {
    atrule: "text-purple-600 dark:text-purple-400",
    attr: "text-yellow-600 dark:text-yellow-400",
    boolean: "text-red-600 dark:text-red-400",
    builtin: "text-cyan-600 dark:text-cyan-400",
    cdata: "text-gray-600 dark:text-gray-400",
    char: "text-green-600 dark:text-green-400",
    class: "text-yellow-600 dark:text-yellow-400",
    "class-name": "text-yellow-600 dark:text-yellow-400",
    comment: "text-gray-500 italic",
    constant: "text-red-600 dark:text-red-400",
    deleted: "text-red-600 dark:text-red-400",
    doctype: "text-gray-600 dark:text-gray-400",
    entity: "text-red-600 dark:text-red-400",
    function: "text-blue-600 dark:text-blue-400",
    important: "text-red-600 dark:text-red-400 font-bold",
    inserted: "text-green-600 dark:text-green-400",
    keyword: "text-purple-600 dark:text-purple-400",
    namespace: "text-gray-600 dark:text-gray-400",
    number: "text-orange-600 dark:text-orange-400",
    operator: "text-gray-600 dark:text-gray-400",
    prolog: "text-gray-600 dark:text-gray-400",
    property: "text-blue-600 dark:text-blue-400",
    punctuation: "text-gray-600 dark:text-gray-400",
    regex: "text-red-600 dark:text-red-400",
    selector: "text-green-600 dark:text-green-400",
    string: "text-green-600 dark:text-green-400",
    symbol: "text-red-600 dark:text-red-400",
    tag: "text-red-600 dark:text-red-400",
    url: "text-cyan-600 dark:text-cyan-400",
    variable: "text-orange-600 dark:text-orange-400",
  },

  // Links
  link: "text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer",

  // Horizontal rule
  hr: "border-t border-border my-8",

  // Images
  image: "max-w-full rounded-lg my-4",

  // Tables
  table: "border-collapse w-full my-4",
  tableCell: "border border-border px-4 py-2",
  tableCellHeader: "border border-border px-4 py-2 bg-muted font-semibold",
  tableRow: "",
};
