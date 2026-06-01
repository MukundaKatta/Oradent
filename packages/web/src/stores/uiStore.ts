import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface ActiveModal {
  id: string;
  props?: Record<string, unknown>;
}

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeModal: ActiveModal | null;
  theme: Theme;
  breadcrumbs: Breadcrumb[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openModal: (id: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  setTheme: (theme: Theme) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      activeModal: null,
      theme: "system",
      breadcrumbs: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) =>
        set({ sidebarCollapsed: collapsed }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      setCommandPaletteOpen: (open: boolean) =>
        set({ commandPaletteOpen: open }),

      openModal: (id: string, props?: Record<string, unknown>) =>
        set({ activeModal: { id, props } }),

      closeModal: () => set({ activeModal: null }),

      setTheme: (theme: Theme) => set({ theme }),

      setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => set({ breadcrumbs }),
    }),
    {
      name: "oradent-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
