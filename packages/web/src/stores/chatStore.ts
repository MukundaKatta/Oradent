import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;

  // Actions
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLoading: (loading: boolean) => void;
  toggleChat: () => void;
  clearMessages: () => void;
}

let messageCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  isOpen: false,

  addMessage: (message) => {
    const id = `msg-${++messageCounter}-${Date.now()}`;
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id, timestamp: Date.now() },
      ],
    }));
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),

  clearMessages: () => set({ messages: [] }),
}));
