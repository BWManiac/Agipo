export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface ThreadsState {
  threads: Thread[];
  activeThreadId: string | null;
  isLoading: boolean;
}

export interface ChatState {
  messages: ThreadMessage[];
  isLoading: boolean;
  threadId: string | null;
}

