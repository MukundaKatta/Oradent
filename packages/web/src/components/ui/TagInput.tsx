'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Add a tag...', maxTags, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    if (maxTags && tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInputValue('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2',
        'focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-sm font-medium text-teal-700"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="rounded-sm p-0.5 transition-colors hover:bg-teal-200 hover:text-teal-900"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {(!maxTags || tags.length < maxTags) && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
      )}
    </div>
  );
}
