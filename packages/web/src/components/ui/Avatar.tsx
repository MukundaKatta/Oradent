'use client';

import { cn } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
];

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  src?: string;
  className?: string;
}

export function Avatar({ name, size = 'md', color, src, className }: AvatarProps) {
  const initials = getInitials(name);
  const determinedColor = color ?? AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'inline-flex shrink-0 rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        sizeClasses[size],
        determinedColor,
        className
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
