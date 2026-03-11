"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Assistant", href: "/ai-assistant", icon: Brain },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-screen flex-col border-r border-stone-800 bg-stone-900"
      style={{ backgroundColor: "#1c1917" }}
    >
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
          {!collapsed && (
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
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-600/20 text-teal-400"
                  : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-teal-400"
                    : "text-stone-500 group-hover:text-stone-300"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
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
        })}
      </nav>

      {/* Provider avatar + collapse toggle */}
      <div className="border-t border-stone-800 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-medium text-white">
            DR
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 overflow-hidden"
              >
                <p className="truncate text-sm font-medium text-stone-200">
                  Dr. Smith
                </p>
                <p className="truncate text-xs text-stone-500">DDS</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.25rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-700"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.aside>
  );
}
