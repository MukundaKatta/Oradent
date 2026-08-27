'use client';

import { useState } from 'react';
import { Brain, Calendar } from 'lucide-react';
import { formatDate } from "@/lib/formatters";
import { apiUrl } from "@/lib/api";
import { imageTypeLabel } from "@/lib/imagingLabels";
import { ptBR } from "@/i18n";
import type { DentalImage } from "@/hooks/useImaging";

interface XrayGalleryProps {
  images: DentalImage[];
  onSelect: (image: DentalImage) => void;
}

export function XrayGallery({ images, onSelect }: XrayGalleryProps) {
  const [filter, setFilter] = useState<string>('');

  const types = Array.from(new Set(images.map((img) => img.type)));
  const filtered = filter ? images.filter((img) => img.type === filter) : images;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
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
            {ptBR.patientWorkflow.imaging.all}
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
              {imageTypeLabel(type)}
            </button>
          ))}
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((image) => (
          <button
            key={image.id}
            onClick={() => onSelect(image)}
            className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-square bg-stone-100">
              <img
                src={apiUrl(image.url)}
                alt={image.fileName}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium text-stone-900">
                {imageTypeLabel(image.type)}
                {image.toothNumbers.length > 0 && ` - #${image.toothNumbers.join(', #')}`}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                <Calendar className="h-3 w-3" />
                {formatDate(image.dateTaken)}
              </div>
            </div>
            {image.aiAnalyses.length > 0 && (
              <div className="absolute right-2 top-2 rounded-full bg-teal-600 p-1.5 shadow-sm">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-stone-400">
          {ptBR.patientWorkflow.imaging.noFilterMatches}
        </div>
      )}
    </div>
  );
}
