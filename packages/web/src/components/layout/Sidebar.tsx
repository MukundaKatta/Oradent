"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Receipt,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  UserPlus,
  FileCheck,
  Activity,
  RefreshCcw,
  ListOrdered,
  DollarSign,
  ShieldCheck,
  FlaskConical,
  Package,
  MessageSquare,
  PieChart,
  FileText,
  FileSpreadsheet,
  CalendarClock,
  UserCog,
  type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface NavChild {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

// ── Navigation structure ───────────────────────────────

const navigation: NavSection[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Morning Huddle", href: "/morning-huddle", icon: Clock },
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
    children: [
      { name: "Referrals", href: "/patients/referrals", icon: UserPlus },
      { name: "Consent Forms", href: "/patients/consent-forms", icon: FileCheck },
      { name: "Perio Chart", href: "/patients/perio-chart", icon: Activity },
      { name: "Recall", href: "/patients/recall", icon: RefreshCcw },
    ],
  },
  {
    name: "Appointments",
    href: "/appointments",
    icon: Calendar,
    children: [
      { name: "Waitlist", href: "/appointments/waitlist", icon: ListOrdered },
    ],
  },
  {
    name: "Billing",
    href: "/billing",
    icon: Receipt,
    children: [
      { name: "Fee Schedule", href: "/billing/fee-schedule", icon: DollarSign },
      { name: "Insurance Verification", href: "/billing/insurance-verification", icon: ShieldCheck },
    ],
  },
  { name: "Lab Cases", href: "/lab-cases", icon: FlaskConical },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Communications", href: "/communications", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Assistant", href: "/ai-assistant", icon: Brain },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { name: "Templates", href: "/settings/templates", icon: FileSpreadsheet },
      { name: "Schedule", href: "/settings/schedule", icon: CalendarClock },
      { name: "Staff Schedule", href: "/settings/staff-schedule", icon: FileText },
      { name: "Employees", href: "/settings/employees", icon: UserCog },
    ],
  },
];

// ── Component ──────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { provider, isCollapsed, toggleSidebar, isMobileMenuOpen, closeMobileMenu, logout } = useAppStore();

  // Track which sections are collapsed (by section name).
  // Sections start expanded.
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Hover-expand when sidebar is collapsed
  const [hovered, setHovered] = useState(false);
  const showLabels = !isCollapsed || hovered;

  const toggleSection = (name: string) => {
    setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }));
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

  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const sidebarWidth = isCollapsed && !hovered ? 64 : 240;

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex h-screen flex-col border-r border-stone-800 bg-stone-900",
          "fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto",
          "transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ backgroundColor: "#1c1917" }}
      >
        {/* Mobile close button */}
        <button
          onClick={closeMobileMenu}
          className="absolute right-2 top-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo / Brand */}
        <div className="flex h-14 items-center gap-3 border-b border-stone-800 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M12 2C9.5 2 7.5 3 6.5 5C5.5 7 5 9 5 11C5 13 5.5 15 6 17C6.5 19 7 21 8.5 22C9.5 22.5 10.5 21 11 19C11.3 17.5 11.7 17.5 12 17.5C12.3 17.5 12.7 17.5 13 19C13.5 21 14.5 22.5 15.5 22C17 21 17.5 19 18 17C18.5 15 19 13 19 11C19 9 18.5 7 17.5 5C16.5 3 14.5 2 12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <AnimatePresence>
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap text-lg font-semibold text-white"
              >
                Oradent
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4 scrollbar-thin">
          {navigation.map((item) => {
            const isActive = isRouteActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isSectionCollapsed = collapsedSections[item.name] ?? false;

            return (
              <div key={item.name}>
                {/* Section header / top-level link */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "group flex flex-1 min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-teal-600 text-white"
                        : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                    )}
                    title={!showLabels ? item.name : undefined}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-stone-500 group-hover:text-stone-300"
                      )}
                    />
                    <AnimatePresence>
                      {showLabels && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex-1 overflow-hidden whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Chevron toggle for collapsible sections */}
                    {hasChildren && showLabels && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSection(item.name);
                        }}
                        className="shrink-0 rounded p-0.5 text-stone-500 hover:text-stone-300 transition-colors"
                        aria-label={isSectionCollapsed ? `Expand ${item.name}` : `Collapse ${item.name}`}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isSectionCollapsed && "-rotate-90"
                          )}
                        />
                      </button>
                    )}
                  </Link>
                </div>

                {/* Child items */}
                {hasChildren && (
                  <AnimatePresence initial={false}>
                    {!isSectionCollapsed && showLabels && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-stone-800 pl-3">
                          {item.children!.map((child) => {
                            const isChildActive = isRouteActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={closeMobileMenu}
                                className={cn(
                                  "group flex min-h-[36px] items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                  isChildActive
                                    ? "bg-teal-600 text-white"
                                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
                                )}
                              >
                                <child.icon
                                  className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    isChildActive
                                      ? "text-white"
                                      : "text-stone-500 group-hover:text-stone-300"
                                  )}
                                />
                                <span className="whitespace-nowrap">{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </nav>

        {/* Provider avatar + logout */}
        <div className="border-t border-stone-800 p-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: provider?.color || "#0d9488" }}
            >
              {initials}
            </div>
            <AnimatePresence>
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-medium text-stone-200">
                    {provider?.name || "Provider"}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {provider?.title || provider?.role || ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showLabels && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  className="shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-stone-800 hover:text-stone-300 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle button - hidden on mobile */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-[4.25rem] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-700 lg:flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </motion.aside>
    </>
  );
}
