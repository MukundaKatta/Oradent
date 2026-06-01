'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

export function FileUploadZone({ onFiles, accept, maxSize, multiple = false }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const fileArray = Array.from(files).filter((file) => {
        if (maxSize && file.size > maxSize) return false;
        return true;
      });
      setSelectedFiles(fileArray);
      onFiles(fileArray);
    },
    [maxSize, onFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(updated);
      onFiles(updated);
    },
    [selectedFiles, onFiles]
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragOver
            ? 'border-teal-600 bg-teal-50'
            : 'border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-stone-100'
        )}
      >
        <UploadCloud
          className={cn(
            'w-8 h-8',
            isDragOver ? 'text-teal-600' : 'text-stone-400'
          )}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-stone-700">
            Drop files here or{' '}
            <span className="text-teal-600">browse</span>
          </p>
          {(accept || maxSize) && (
            <p className="text-xs text-stone-400 mt-1">
              {accept && `Accepted: ${accept}`}
              {accept && maxSize && ' · '}
              {maxSize && `Max: ${formatSize(maxSize)}`}
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <ul className="space-y-2">
          {selectedFiles.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-sm text-stone-700 truncate">{file.name}</span>
                <span className="text-xs text-stone-400 shrink-0">{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
