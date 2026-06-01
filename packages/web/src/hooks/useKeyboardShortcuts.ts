'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      {
        key: '1',
        altKey: true,
        action: () => router.push('/'),
        description: 'Go to Dashboard',
      },
      {
        key: '2',
        altKey: true,
        action: () => router.push('/morning-huddle'),
        description: 'Go to Morning Huddle',
      },
      {
        key: '3',
        altKey: true,
        action: () => router.push('/patients'),
        description: 'Go to Patients',
      },
      {
        key: '4',
        altKey: true,
        action: () => router.push('/appointments'),
        description: 'Go to Appointments',
      },
      {
        key: '5',
        altKey: true,
        action: () => router.push('/billing'),
        description: 'Go to Billing',
      },
      {
        key: '6',
        altKey: true,
        action: () => router.push('/reports'),
        description: 'Go to Reports',
      },
      {
        key: 'n',
        altKey: true,
        action: () => router.push('/patients?new=true'),
        description: 'New Patient',
      },
      {
        key: 'a',
        altKey: true,
        action: () => router.push('/appointments?new=true'),
        description: 'New Appointment',
      },
    ];

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const altMatch = shortcut.altKey ? e.altKey : !e.altKey;
        const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;

        if (e.key === shortcut.key && altMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
