"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import { ptBR } from "@/i18n";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  ChevronDown,
  LogOut,
} from "lucide-react";

const topLevel = { name: ptBR.shell.navigation.dashboard, href: "/", icon: LayoutDashboard };

const groups = [
  {
    label: ptBR.shell.navigation.groupClinic,
    items: [
      { name: ptBR.shell.navigation.patients, href: "/patients", icon: Users },
      { name: ptBR.shell.navigation.appointments, href: "/appointments", icon: Calendar },
      { name: ptBR.shell.navigation.billing, href: "/billing", icon: Receipt },
    ],
  },
  {
    label: ptBR.shell.navigation.groupInsights,
    items: [
      { name: ptBR.shell.navigation.reports, href: "/reports", icon: BarChart3 },
      { name: ptBR.shell.navigation.aiAssistant, href: "/ai-assistant", icon: Brain },
    ],
  },
];

const settingsItem = { name: ptBR.shell.navigation.settings, href: "/settings", icon: Settings };

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard };

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 2C9.5 2 7.5 3 6.5 5C5.5 7 5 9 5 11C5 13 5.5 15 6 17C6.5 19 7 21 8.5 22C9.5 22.5 10.5 21 11 19C11.3 17.5 11.7 17.5 12 17.5C12.3 17.5 12.7 17.5 13 19C13.5 21 14.5 22.5 15.5 22C17 21 17.5 19 18 17C18.5 15 19 13 19 11C19 9 18.5 7 17.5 5C16.5 3 14.5 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { provider, practice, isCollapsed, toggleSidebar, logout } = useAppStore();

  const isItemActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(href + "/");

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item.href);

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-white/10 text-teal-300 shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.1)]"
            : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isActive ? "text-teal-400" : "text-stone-500 group-hover:text-stone-300"
          )}
        />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  const initials = provider?.name
    ? provider.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  const handleLogout = () => {
    logout();
    localStorage.removeItem("oradent_token");
    localStorage.removeItem("oradent_refresh_token");
    router.push("/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="glass-dark relative flex h-screen flex-col"
    >
      {/* Practice switcher */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600 transition-opacity hover:opacity-90"
            title={ptBR.shell.sidebar.expand}
            aria-label={ptBR.shell.sidebar.expand}
          >
            <ToothIcon className="h-[18px] w-[18px] text-white" />
          </button>
        ) : (
          <>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 text-left transition-colors hover:bg-white/5"
                  aria-label={ptBR.shell.sidebar.openPracticeMenu}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600">
                    <ToothIcon className="h-[18px] w-[18px] text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-white">
                      {practice?.name || "Oradent"}
                    </p>
                    <p className="truncate text-[11px] leading-tight text-stone-500">
                      {ptBR.shell.sidebar.practiceLabel}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={8}
                  className="glass-card z-50 min-w-[220px] overflow-hidden p-1 shadow-apple-lg animate-in fade-in-0 zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-white/10 mb-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {practice?.name || "Oradent"}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {ptBR.shell.sidebar.practiceLabel}
                    </p>
                  </div>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/settings"
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 dark:text-stone-200 outline-none transition-colors hover:bg-stone-100 focus:bg-stone-100 dark:hover:bg-stone-800 dark:focus:bg-stone-800"
                    >
                      <Settings className="h-4 w-4" />
                      {ptBR.shell.sidebar.practiceSettings}
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            <button
              onClick={toggleSidebar}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-white/10 hover:text-stone-300"
              title={ptBR.shell.sidebar.collapse}
              aria-label={ptBR.shell.sidebar.collapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4 scrollbar-thin">
        <div className="space-y-1">{renderNavItem(topLevel)}</div>

        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                {group.label}
              </p>
            )}
            {group.items.map(renderNavItem)}
          </div>
        ))}
      </nav>

      {/* Settings — pinned apart from the daily-use workflow above */}
      <div className="border-t border-white/10 px-2 py-2">{renderNavItem(settingsItem)}</div>

      {/* Provider avatar + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: provider?.color || "#0d9488" }}
          >
            {initials}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-stone-200">
                  {provider?.name || ptBR.shell.profile.provider}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {provider?.title || provider?.role || ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
                title={ptBR.shell.profile.signOut}
                aria-label={ptBR.shell.profile.signOut}
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
