// Keyboard Shortcuts Data

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

// Helper to detect Mac OS (client-side only)
export function isMac(): boolean {
  if (typeof window === "undefined") return true; // Default to Mac symbols for SSR
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

// Get the modifier key symbol based on OS
export function getModKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

export function getShiftKey(): string {
  return isMac() ? "⇧" : "Shift";
}

// Generate shortcuts with correct modifier keys
export function getKeyboardShortcuts(): KeyboardShortcut[] {
  const mod = getModKey();
  const shift = getShiftKey();

  return [
    // Formatting
    { keys: [mod, "B"], description: "Bold", category: "Formatting" },
    { keys: [mod, "I"], description: "Italic", category: "Formatting" },
    { keys: [mod, "U"], description: "Underline", category: "Formatting" },
    { keys: [mod, shift, "S"], description: "Strikethrough", category: "Formatting" },
    { keys: [mod, "E"], description: "Inline code", category: "Formatting" },
    { keys: [mod, "K"], description: "Insert link", category: "Formatting" },

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
    { keys: [mod, "Z"], description: "Undo", category: "Navigation" },
    { keys: [mod, shift, "Z"], description: "Redo", category: "Navigation" },
    { keys: [mod, "S"], description: "Save", category: "Navigation" },
    { keys: [mod, "\\"], description: "Toggle outline", category: "Navigation" },

    // App
    { keys: ["?"], description: "Show keyboard shortcuts", category: "App" },
  ];
}

export const SHORTCUT_CATEGORIES = [
  "Formatting",
  "Blocks",
  "Navigation",
  "App",
];
