import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  theme: Theme;
  breadcrumbs: Breadcrumb[];

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setActiveModal: (modal: string | null) => void;
  clearModal: () => void;
  setTheme: (theme: Theme) => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 256,
      commandPaletteOpen: false,
      activeModal: null,
      theme: "system",
      breadcrumbs: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarWidth: (width: number) => set({ sidebarWidth: width }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),

      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      setActiveModal: (modal: string | null) => set({ activeModal: modal }),

      clearModal: () => set({ activeModal: null }),

      setTheme: (theme: Theme) => set({ theme }),

      setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => set({ breadcrumbs }),
    }),
    {
      name: "oradent-ui-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
      }),
    }
  )
);
