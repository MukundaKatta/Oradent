"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatters";
import { ptBR } from "@/i18n";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
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
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { name: ptBR.shell.navigation.dashboard, href: "/dashboard", icon: LayoutDashboard },
  { name: ptBR.shell.navigation.patients, href: "/patients", icon: Users },
  { name: ptBR.shell.navigation.appointments, href: "/appointments", icon: Calendar },
  { name: ptBR.shell.navigation.billing, href: "/billing", icon: Receipt },
  { name: ptBR.shell.navigation.reports, href: "/reports", icon: BarChart3 },
  { name: ptBR.shell.navigation.aiAssistant, href: "/ai-assistant", icon: Brain },
  { name: ptBR.shell.navigation.settings, href: "/settings", icon: Settings },
];

const actionItems = [
  { name: ptBR.shell.commandPalette.newPatient, href: "/patients/new", icon: UserPlus },
  { name: ptBR.shell.commandPalette.newAppointment, href: "/appointments/new", icon: CalendarPlus },
  { name: ptBR.shell.commandPalette.newInvoice, href: "/billing/new", icon: FileText },
];

// Mock patient search results
const mockPatients = [
  { id: "1", name: "John Doe", dob: "1985-03-15" },
  { id: "2", name: "Jane Smith", dob: "1990-07-22" },
  { id: "3", name: "Robert Johnson", dob: "1978-11-08" },
  { id: "4", name: "Maria Garcia", dob: "1995-01-30" },
  { id: "5", name: "David Chen", dob: "1982-09-12" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

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

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95">
          <Command className="flex flex-col" label={ptBR.shell.commandPalette.label}>
            <div className="flex items-center gap-2 border-b border-stone-200 px-4">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <Command.Input
                placeholder={ptBR.shell.commandPalette.placeholder}
                className="flex h-12 w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-thin">
              <Command.Empty className="py-8 text-center text-sm text-stone-500">
                {ptBR.shell.commandPalette.noResults}
              </Command.Empty>

              {/* Patients */}
              <Command.Group
                heading={ptBR.shell.commandPalette.patients}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-stone-500"
              >
                {mockPatients.map((patient) => (
                  <Command.Item
                    key={patient.id}
                    value={patient.name}
                    onSelect={() => navigate(`/patients/${patient.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-700 transition-colors aria-selected:bg-teal-50 aria-selected:text-teal-900"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-xs text-stone-400">
                        {ptBR.shell.commandPalette.dateOfBirth}: {formatDate(patient.dob)}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Navigation */}
              <Command.Group
                heading={ptBR.shell.commandPalette.navigation}
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
                heading={ptBR.shell.commandPalette.actions}
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
                  {ptBR.shell.commandPalette.navigate}
                </span>
                <span>
                  <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px]">
                    ↵
                  </kbd>{" "}
                  {ptBR.shell.commandPalette.select}
                </span>
                <span>
                  <kbd className="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono text-[10px]">
                    Esc
                  </kbd>{" "}
                  {ptBR.shell.commandPalette.close}
                </span>
              </div>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
