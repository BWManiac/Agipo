// Keyboard Shortcuts Data

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Formatting
  { keys: ["⌘", "B"], description: "Bold", category: "Formatting" },
  { keys: ["⌘", "I"], description: "Italic", category: "Formatting" },
  { keys: ["⌘", "U"], description: "Underline", category: "Formatting" },
  { keys: ["⌘", "⇧", "S"], description: "Strikethrough", category: "Formatting" },
  { keys: ["⌘", "E"], description: "Inline code", category: "Formatting" },
  { keys: ["⌘", "K"], description: "Insert link", category: "Formatting" },

  // Blocks
  { keys: ["/"], description: "Open slash command menu", category: "Blocks" },
  { keys: ["#"], description: "Heading 1 (at line start)", category: "Blocks" },
  { keys: ["##"], description: "Heading 2 (at line start)", category: "Blocks" },
  { keys: ["###"], description: "Heading 3 (at line start)", category: "Blocks" },
  { keys: ["-"], description: "Bullet list (at line start)", category: "Blocks" },
  { keys: ["1."], description: "Numbered list (at line start)", category: "Blocks" },
  { keys: [">"], description: "Blockquote (at line start)", category: "Blocks" },
  { keys: ["```"], description: "Code block", category: "Blocks" },

  // Navigation
  { keys: ["⌘", "Z"], description: "Undo", category: "Navigation" },
  { keys: ["⌘", "⇧", "Z"], description: "Redo", category: "Navigation" },
  { keys: ["⌘", "S"], description: "Save", category: "Navigation" },

  // App
  { keys: ["?"], description: "Show keyboard shortcuts", category: "App" },
];

export const SHORTCUT_CATEGORIES = [
  "Formatting",
  "Blocks",
  "Navigation",
  "App",
];
