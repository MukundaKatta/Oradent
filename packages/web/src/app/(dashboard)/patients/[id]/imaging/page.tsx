'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  Brain,
  Upload,
  Filter,
  Image as ImageIcon,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import type { DentalImage, ImageType, Patient } from '@/types';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { XrayUploader } from '@/components/imaging/XrayUploader';
import { ImageViewerModal } from '@/components/imaging/ImageViewerModal';

const IMAGE_TYPE_OPTIONS: { value: ImageType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'PERIAPICAL', label: 'Periapical' },
  { value: 'BITEWING', label: 'Bitewing' },
  { value: 'PANORAMIC', label: 'Panoramic' },
  { value: 'CEPHALOMETRIC', label: 'Cephalometric' },
  { value: 'CBCT', label: 'CBCT' },
  { value: 'INTRAORAL_PHOTO', label: 'Intraoral Photo' },
  { value: 'EXTRAORAL_PHOTO', label: 'Extraoral Photo' },
  { value: 'OTHER', label: 'Other' },
];

const TYPE_LABELS: Record<string, string> = {
  PERIAPICAL: 'Periapical',
  BITEWING: 'Bitewing',
  PANORAMIC: 'Panoramic',
  CEPHALOMETRIC: 'Cephalometric',
  CBCT: 'CBCT',
  INTRAORAL_PHOTO: 'Intraoral Photo',
  EXTRAORAL_PHOTO: 'Extraoral Photo',
  OTHER: 'Other',
};

type SortOrder = 'newest' | 'oldest';

export default function PatientImagingPage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;

  const [showUploader, setShowUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState<DentalImage | null>(null);
  const [typeFilter, setTypeFilter] = useState<ImageType | ''>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const {
    data: images,
    isLoading: imagesLoading,
    refetch,
  } = useQuery<DentalImage[]>({
    queryKey: ['patient-images', patientId],
    queryFn: () => apiGet<DentalImage[]>('/api/imaging/' + patientId),
    enabled: !!patientId,
  });

  const { data: patient } = useQuery<Patient>({
    queryKey: ['patient', patientId],
    queryFn: () => apiGet<Patient>('/api/patients/' + patientId),
    enabled: !!patientId,
  });

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : 'Patient';

  const filteredAndSorted = useMemo(() => {
    if (!images) return [];
    let result = [...images];
    if (typeFilter) {
      result = result.filter((img) => img.type === typeFilter);
    }
    result.sort((a, b) => {
      const dateA = new Date(a.dateTaken).getTime();
      const dateB = new Date(b.dateTaken).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [images, typeFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Patients', href: '/patients' },
          { label: patientName, href: `/patients/${patientId}` },
          { label: 'Imaging' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Imaging</h1>
          <p className="mt-1 text-sm text-stone-500">
            {images?.length ?? 0} image{images?.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ImageType | '')}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {IMAGE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {imagesLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] bg-stone-200 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-20 rounded bg-stone-200" />
                <div className="h-3 w-32 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image preview */}
              <div className="aspect-[4/3] bg-stone-100">
                <img
                  src={image.filePath}
                  alt={image.fileName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('[data-placeholder]')) {
                      const placeholder = document.createElement('div');
                      placeholder.setAttribute('data-placeholder', 'true');
                      placeholder.className =
                        'flex h-full w-full items-center justify-center';
                      placeholder.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>';
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>

              {/* Card info */}
              <div className="p-3">
                <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                  {TYPE_LABELS[image.type] || image.type}
                </span>
                <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(image.dateTaken)}
                </div>
                {image.toothNumbers.length > 0 && (
                  <p className="mt-1 text-xs text-stone-500">
                    Teeth: {image.toothNumbers.map((t) => `#${t}`).join(', ')}
                  </p>
                )}
              </div>

              {/* AI analysis indicator */}
              {image.aiAnalyses && image.aiAnalyses.length > 0 && (
                <div className="absolute right-2 top-2 rounded-full bg-teal-600 p-1.5 shadow-sm">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : images && images.length > 0 && typeFilter ? (
        /* Filter produced no results but images exist */
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <ImageIcon className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-lg font-medium text-stone-700">
            No matching images
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            No images match the selected filter. Try a different type.
          </p>
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-stone-100 p-4">
            <Camera className="h-8 w-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-700">No images yet</h3>
          <p className="mt-1 text-sm text-stone-500">
            Upload X-rays and dental images for this patient.
          </p>
          <button
            onClick={() => setShowUploader(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload First Image
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploader && (
        <XrayUploader
          patientId={patientId}
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onUploaded={() => {
            setShowUploader(false);
            refetch();
          }}
        />
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
