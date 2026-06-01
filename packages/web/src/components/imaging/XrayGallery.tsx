'use client';

import { useState, useMemo } from 'react';
import { Brain, Calendar, Grid2X2, Grid3X3, LayoutGrid } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { format } from 'date-fns';

interface XrayImage {
  id: string;
  patientId: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  type: string;
  toothNumber?: number;
  uploadedAt: string;
  uploadedBy: string;
  aiAnalyzed: boolean;
  analysisId?: string;
}

interface XrayGalleryProps {
  images: XrayImage[];
  onSelect: (image: XrayImage) => void;
}

const TYPE_LABELS: Record<string, string> = {
  periapical: 'Periapical',
  bitewing: 'Bitewing',
  panoramic: 'Panoramic',
  cephalometric: 'Cephalometric',
  cbct: 'CBCT',
  intraoral: 'Intraoral',
  other: 'Other',
};

type ThumbnailSize = 'small' | 'medium' | 'large';

const sizeGridCols: Record<ThumbnailSize, string> = {
  small: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
  medium: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

function getMonthKey(dateStr: string): string {
  return format(new Date(dateStr), 'yyyy-MM');
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return format(new Date(Number(year), Number(month) - 1, 1), 'MMMM yyyy');
}

export function XrayGallery({ images, onSelect }: XrayGalleryProps) {
  const [filter, setFilter] = useState<string>('');
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium');

  const types = Array.from(new Set(images.map((img) => img.type)));
  const filtered = filter ? images.filter((img) => img.type === filter) : images;

  // Group filtered images by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, XrayImage[]> = {};
    for (const img of filtered) {
      const key = getMonthKey(img.uploadedAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(img);
    }
    // Sort months descending
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map((key) => ({ key, label: getMonthLabel(key), images: groups[key] }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter bar + size toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {types.length > 1 && (
          <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
            <button
              onClick={() => setFilter('')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !filter
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === type
                    ? 'bg-teal-600 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {TYPE_LABELS[type] || type}
              </button>
            ))}
          </div>
        )}

        {/* Thumbnail size toggle */}
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1">
          <button
            onClick={() => setThumbnailSize('small')}
            className={`rounded-md p-1.5 transition-colors ${
              thumbnailSize === 'small'
                ? 'bg-teal-600 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="Small thumbnails"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setThumbnailSize('medium')}
            className={`rounded-md p-1.5 transition-colors ${
              thumbnailSize === 'medium'
                ? 'bg-teal-600 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="Medium thumbnails"
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setThumbnailSize('large')}
            className={`rounded-md p-1.5 transition-colors ${
              thumbnailSize === 'large'
                ? 'bg-teal-600 text-white'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="Large thumbnails"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grouped image grid */}
      {groupedByMonth.map((group) => (
        <div key={group.key}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-stone-700">{group.label}</h3>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
              {group.images.length} image{group.images.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={`grid gap-4 ${sizeGridCols[thumbnailSize]}`}>
            {group.images.map((image) => (
              <button
                key={image.id}
                onClick={() => onSelect(image)}
                className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-stone-100">
                  <img
                    src={image.thumbnailUrl}
                    alt={image.filename}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-stone-900">
                    {TYPE_LABELS[image.type] || image.type}
                    {image.toothNumber && ` - #${image.toothNumber}`}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(image.uploadedAt)}
                  </div>
                </div>
                {image.aiAnalyzed && (
                  <div className="absolute right-2 top-2 rounded-full bg-teal-600 p-1.5 shadow-sm">
                    <Brain className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-stone-400">
          No images match the selected filter.
        </div>
      )}
    </div>
  );
}
