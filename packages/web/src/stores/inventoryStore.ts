import { create } from "zustand";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
}

export interface InventoryFilters {
  search: string;
  category: string;
  lowStockOnly: boolean;
}

interface InventoryState {
  items: InventoryItem[];
  filters: InventoryFilters;

  // Actions
  setItems: (items: InventoryItem[]) => void;
  addItem: (item: InventoryItem) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeItem: (id: string) => void;
  adjustStock: (id: string, adjustment: number) => void;
  setFilters: (filters: Partial<InventoryFilters>) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  filters: {
    search: "",
    category: "",
    lowStockOnly: false,
  },

  setItems: (items: InventoryItem[]) => set({ items }),

  addItem: (item: InventoryItem) =>
    set((state) => ({ items: [...state.items, item] })),

  updateItem: (id: string, updates: Partial<InventoryItem>) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id: string) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  adjustStock: (id: string, adjustment: number) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + adjustment) }
          : item
      ),
    })),

  setFilters: (filters: Partial<InventoryFilters>) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
