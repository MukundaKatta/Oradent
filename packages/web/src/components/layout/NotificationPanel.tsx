"use client";

import { useEffect, useRef } from "react";
import {
  Calendar,
  Receipt,
  Brain,
  AlertCircle,
  Check,
  X,
  Trash2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notificationStore";
import { formatRelativeDate } from "@/lib/formatters";

const typeConfig = {
  appointment: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  billing: {
    icon: Receipt,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  ai: {
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  system: {
    icon: AlertCircle,
    color: "text-stone-600",
    bg: "bg-stone-50",
  },
  success: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  warning: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
} as const;

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl animate-in fade-in-0 slide-in-from-top-2"
    >
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-stone-900">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-medium text-teal-700">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400">
            <Check className="mb-2 h-8 w-8" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="mt-1 text-xs">No notifications to show</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const config =
                typeConfig[notification.type as keyof typeof typeConfig] ||
                typeConfig.system;
              const Icon = config.icon;

              return (
                <button
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50",
                    !notification.read && "bg-teal-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          notification.read
                            ? "text-stone-600"
                            : "font-medium text-stone-900"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-stone-400">
                      {formatRelativeDate(new Date(notification.timestamp))}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 5 && (
        <div className="border-t border-stone-100 px-4 py-2">
          <p className="text-center text-xs text-stone-400">
            Showing {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
}
