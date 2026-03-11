"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "./NotificationPanel";
import { CommandPalette } from "./CommandPalette";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = "Dashboard" }: TopBarProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white px-6">
        {/* Left: Page title */}
        <div>
          <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
        </div>

        {/* Center: Search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-80 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:bg-stone-100"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search patients, actions...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-stone-200 bg-white px-1.5 font-mono text-[10px] font-medium text-stone-500 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Right: Date, notifications, profile */}
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-stone-500 lg:block">{today}</span>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                3
              </span>
            </button>

            {notificationsOpen && (
              <NotificationPanel
                onClose={() => setNotificationsOpen(false)}
              />
            )}
          </div>

          {/* Provider dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-medium text-white">
                  DR
                </div>
                <ChevronDown className="h-4 w-4 text-stone-400" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-stone-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
              >
                <div className="px-3 py-2 border-b border-stone-100 mb-1">
                  <p className="text-sm font-medium text-stone-900">
                    Dr. Smith
                  </p>
                  <p className="text-xs text-stone-500">
                    dr.smith@oradent.com
                  </p>
                </div>

                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 outline-none transition-colors hover:bg-stone-100 focus:bg-stone-100">
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenu.Item>

                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-stone-700 outline-none transition-colors hover:bg-stone-100 focus:bg-stone-100">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-stone-100" />

                <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none transition-colors hover:bg-red-50 focus:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
