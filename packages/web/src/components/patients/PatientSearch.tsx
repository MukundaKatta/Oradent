'use client';

import { Search, X } from "lucide-react";
import { ptBR } from "@/i18n";

interface PatientSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function PatientSearch({ value, onChange }: PatientSearchProps) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
      <input
        type="text"
        placeholder={ptBR.patientWorkflow.list.searchPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2.5 pl-10 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-apple-sm backdrop-blur-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-white/10 dark:hover:text-stone-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
