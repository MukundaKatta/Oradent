"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  BarChart3,
  Brain,
  Settings,
  UserPlus,
  CalendarPlus,
  FileText,
  Search,
  RefreshCcw,
  ClipboardList,
  FileCheck,
  MessageSquare,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientResult {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
}

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Recall & Recare", href: "/recall", icon: RefreshCcw },
  { name: "Waitlist", href: "/waitlist", icon: ClipboardList },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Consent Forms", href: "/consent", icon: FileCheck },
  { name: "Communications", href: "/communications", icon: MessageSquare },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Assistant", href: "/ai-assistant", icon: Brain },
  { name: "Settings", href: "/settings", icon: Settings },
];

const actionItems = [
  { name: "New Patient", href: "/patients/new", icon: UserPlus },
  { name: "New Appointment", href: "/appointments/new", icon: CalendarPlus },
  { name: "New Invoice", href: "/billing/new", icon: FileText },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Live patient search
  const { data: patientResults } = useQuery<{
    patients: PatientResult[];
  }>({
    queryKey: ["command-palette-patients", search],
    queryFn: () => apiGet(`/api/patients?search=${encodeURIComponent(search)}&limit=8`),
    enabled: open && search.length >= 2,
    staleTime: 10_000,
  });

  const patients = patientResults?.patients ?? [];

  // Keyboard shortcut
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
          <Command className="flex flex-col" label="Command palette">
            <div className="flex items-center gap-2 border-b border-stone-200 px-4">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <Command.Input
                placeholder="Search patients, navigate, or run actions..."
                value={search}
                onValueChange={setSearch}
                className="flex h-12 w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="py-8 text-center text-sm text-stone-500">
                {search.length >= 2
                  ? "No results found."
                  : "Type to search patients..."}
              </Command.Empty>

              {/* Live Patient Results */}
              {patients.length > 0 && (
                <Command.Group
                  heading="Patients"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-stone-500"
                >
                  {patients.map((patient) => (
                    <Command.Item
                      key={patient.id}
                      value={`${patient.firstName} ${patient.lastName}`}
                      onSelect={() => navigate(`/patients/${patient.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-700 transition-colors aria-selected:bg-teal-50 aria-selected:text-teal-900"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-medium truncate">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-stone-400 truncate">
                          {patient.phone}
                          {patient.email ? ` · ${patient.email}` : ""}
                        </p>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Navigation */}
              <Command.Group
                heading="Navigation"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-stone-500"
              >
                {navigationItems.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.name}
                    onSelect={() => navigate(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 transition-colors aria-selected:bg-teal-50 aria-selected:text-teal-900"
                  >
                    <item.icon className="h-4 w-4 text-stone-400" />
                    <span>{item.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Actions */}
              <Command.Group
                heading="Actions"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-stone-500"
              >
                {actionItems.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={item.name}
                    onSelect={() => navigate(item.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 transition-colors aria-selected:bg-teal-50 aria-selected:text-teal-900"
                  >
                    <item.icon className="h-4 w-4 text-teal-600" />
                    <span>{item.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2">
              <div className="flex items-center gap-4 text-xs text-stone-400">
                <span>
                  <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px]">
                    ↑↓
                  </kbd>{" "}
                  Navigate
                </span>
                <span>
                  <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px]">
                    ↵
                  </kbd>{" "}
                  Select
                </span>
                <span>
                  <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px]">
                    Esc
                  </kbd>{" "}
                  Close
                </span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
