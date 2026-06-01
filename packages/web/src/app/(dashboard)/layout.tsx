"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SkipNavigation } from "@/components/layout/SkipNavigation";
import { useAppStore } from "@/stores/appStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { useNotificationStore } from "@/stores/notificationStore";
import { Toaster } from "@/components/ui/Toaster";
import { apiGet } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useKeyboardShortcuts();
  useSessionTimeout();
  useSocket();
  useSocketEvent<{ type: string; title: string; message: string }>("notification", (data) => {
    useNotificationStore.getState().addNotification({
      type: data.type as "success" | "error" | "warning" | "info",
      title: data.title,
      message: data.message,
    });
  });
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const { login, provider } = useAppStore();

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("oradent_token")
        : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    // Hydrate user data if not in store
    if (!provider) {
      apiGet<{ provider: any; practice: any }>("/api/auth/me")
        .then((data) => {
          login(token, data.provider, data.practice);
          setIsAuthed(true);
        })
        .catch(() => {
          router.replace("/login");
        });
    } else {
      setIsAuthed(true);
    }
  }, [router, provider, login]);

  if (isAuthed === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <p className="text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <SkipNavigation />
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
    <Toaster />
    </>
  );
}
