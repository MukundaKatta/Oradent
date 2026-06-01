'use client';

import { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image,
  CreditCard,
  FileCheck,
  File,
  X,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type DocumentCategory =
  | 'Insurance Card'
  | 'ID/Drivers License'
  | 'X-Rays'
  | 'Referral Letter'
  | 'Other';

interface PatientDocument {
  id: string;
  fileName: string;
  category: DocumentCategory;
  uploadDate: string;
  uploadedBy: string;
  patient: string;
  fileSize: string;
  fileType: string;
  thumbnailColor: string;
}

// ═══════════════════ MOCK DATA ═══════════════════

const MOCK_DOCUMENTS: PatientDocument[] = [
  {
    id: 'doc1',
    fileName: 'insurance_card_front.jpg',
    category: 'Insurance Card',
    uploadDate: '2026-05-28',
    uploadedBy: 'Maria Santos',
    patient: 'Sarah Johnson',
    fileSize: '1.2 MB',
    fileType: 'image/jpeg',
    thumbnailColor: 'bg-blue-100',
  },
  {
    id: 'doc2',
    fileName: 'insurance_card_back.jpg',
    category: 'Insurance Card',
    uploadDate: '2026-05-28',
    uploadedBy: 'Maria Santos',
    patient: 'Sarah Johnson',
    fileSize: '1.1 MB',
    fileType: 'image/jpeg',
    thumbnailColor: 'bg-blue-100',
  },
  {
    id: 'doc3',
    fileName: 'drivers_license.png',
    category: 'ID/Drivers License',
    uploadDate: '2026-05-15',
    uploadedBy: 'Maria Santos',
    patient: 'Michael Chen',
    fileSize: '2.4 MB',
    fileType: 'image/png',
    thumbnailColor: 'bg-purple-100',
  },
  {
    id: 'doc4',
    fileName: 'panoramic_xray_2026.dcm',
    category: 'X-Rays',
    uploadDate: '2026-05-20',
    uploadedBy: 'Dr. Emily Carter',
    patient: 'Robert Williams',
    fileSize: '8.7 MB',
    fileType: 'application/dicom',
    thumbnailColor: 'bg-stone-100',
  },
  {
    id: 'doc5',
    fileName: 'bitewing_series.jpg',
    category: 'X-Rays',
    uploadDate: '2026-05-22',
    uploadedBy: 'Dr. Emily Carter',
    patient: 'Lisa Martinez',
    fileSize: '3.5 MB',
    fileType: 'image/jpeg',
    thumbnailColor: 'bg-stone-100',
  },
  {
    id: 'doc6',
    fileName: 'referral_dr_patel.pdf',
    category: 'Referral Letter',
    uploadDate: '2026-04-10',
    uploadedBy: 'Maria Santos',
    patient: 'Robert Williams',
    fileSize: '245 KB',
    fileType: 'application/pdf',
    thumbnailColor: 'bg-amber-100',
  },
  {
    id: 'doc7',
    fileName: 'consent_form_signed.pdf',
    category: 'Other',
    uploadDate: '2026-05-18',
    uploadedBy: 'Maria Santos',
    patient: 'Amanda Thompson',
    fileSize: '156 KB',
    fileType: 'application/pdf',
    thumbnailColor: 'bg-stone-100',
  },
  {
    id: 'doc8',
    fileName: 'periapical_19.jpg',
    category: 'X-Rays',
    uploadDate: '2026-05-25',
    uploadedBy: 'Dr. James Wilson',
    patient: 'Michael Chen',
    fileSize: '1.8 MB',
    fileType: 'image/jpeg',
    thumbnailColor: 'bg-stone-100',
  },
];

const CATEGORIES: DocumentCategory[] = [
  'Insurance Card',
  'ID/Drivers License',
  'X-Rays',
  'Referral Letter',
  'Other',
];

const CATEGORY_ICONS: Record<DocumentCategory, typeof FileText> = {
  'Insurance Card': CreditCard,
  'ID/Drivers License': FileCheck,
  'X-Rays': Image,
  'Referral Letter': FileText,
  Other: File,
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  'Insurance Card': 'bg-blue-100 text-blue-700 border-blue-200',
  'ID/Drivers License': 'bg-purple-100 text-purple-700 border-purple-200',
  'X-Rays': 'bg-stone-100 text-stone-700 border-stone-200',
  'Referral Letter': 'bg-amber-100 text-amber-700 border-amber-200',
  Other: 'bg-stone-100 text-stone-600 border-stone-200',
};

// ═══════════════════ MAIN PAGE ═══════════════════

export default function DocumentScannerPage() {
  const [documents, setDocuments] = useState<PatientDocument[]>(MOCK_DOCUMENTS);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | ''>('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Insurance Card');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [viewDoc, setViewDoc] = useState<PatientDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<PatientDocument | null>(null);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
      doc.patient.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const newUploaded = files.map((f) => ({
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      }));
      setUploadedFiles((prev) => [...prev, ...newUploaded]);

      // Simulate adding to documents list
      const newDocs: PatientDocument[] = files.map((f, i) => ({
        id: `upload-${Date.now()}-${i}`,
        fileName: f.name,
        category: uploadCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'Current User',
        patient: 'Unassigned',
        fileSize: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        fileType: f.type,
        thumbnailColor: 'bg-green-100',
      }));
      setDocuments((prev) => [...newDocs, ...prev]);
    },
    [uploadCategory]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      const newUploaded = files.map((f) => ({
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      }));
      setUploadedFiles((prev) => [...prev, ...newUploaded]);

      const newDocs: PatientDocument[] = files.map((f, i) => ({
        id: `upload-${Date.now()}-${i}`,
        fileName: f.name,
        category: uploadCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'Current User',
        patient: 'Unassigned',
        fileSize: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        fileType: f.type,
        thumbnailColor: 'bg-green-100',
      }));
      setDocuments((prev) => [...newDocs, ...prev]);
      e.target.value = '';
    },
    [uploadCategory]
  );

  const handleDelete = (doc: PatientDocument) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setDeleteDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Document Scanner</h1>
        <p className="mt-1 text-sm text-stone-500">
          Upload, organize, and manage patient documents.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">Upload Documents</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-stone-500">Category:</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors',
            dragActive
              ? 'border-teal-400 bg-teal-50'
              : 'border-stone-300 bg-stone-50 hover:border-stone-400'
          )}
        >
          <Upload
            className={cn('h-10 w-10', dragActive ? 'text-teal-500' : 'text-stone-400')}
          />
          <p className="mt-3 text-sm font-medium text-stone-700">
            {dragActive ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="mt-1 text-xs text-stone-500">or</p>
          <label className="mt-3 cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700">
            Browse Files
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.dcm"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
          <p className="mt-3 text-xs text-stone-400">
            Supports JPG, PNG, PDF, DICOM files up to 25MB
          </p>
        </div>

        {/* Recently uploaded */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-stone-500">Recently Uploaded</p>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">{file.name}</span>
                  <span className="text-xs text-green-500">{file.size}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name, patient, or uploader..."
            className="w-full rounded-lg border border-stone-300 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            <Filter className="h-4 w-4" />
            {filterCategory || 'All Categories'}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setFilterCategory('');
                    setShowFilterMenu(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    !filterCategory
                      ? 'bg-teal-50 font-medium text-teal-700'
                      : 'text-stone-600 hover:bg-stone-50'
                  )}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setFilterCategory(cat);
                      setShowFilterMenu(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      filterCategory === cat
                        ? 'bg-teal-50 font-medium text-teal-700'
                        : 'text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">
            Documents ({filteredDocuments.length})
          </h2>
        </div>
        {filteredDocuments.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No documents found</h3>
            <p className="mt-1 text-xs text-stone-500">
              {search || filterCategory
                ? 'Try adjusting your search or filter.'
                : 'Upload documents to get started.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredDocuments.map((doc) => {
              const CatIcon = CATEGORY_ICONS[doc.category];
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-stone-50"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail placeholder */}
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg',
                        doc.thumbnailColor
                      )}
                    >
                      <CatIcon className="h-6 w-6 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{doc.fileName}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-500">
                        <span>{doc.patient}</span>
                        <span className="text-stone-300">|</span>
                        <span>{doc.fileSize}</span>
                        <span className="text-stone-300">|</span>
                        <span>{doc.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        CATEGORY_COLORS[doc.category]
                      )}
                    >
                      {doc.category}
                    </span>
                    <span className="hidden text-xs text-stone-400 sm:inline">
                      by {doc.uploadedBy}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewDoc(doc)}
                        className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-stone-900">Document Details</h3>
              <button
                onClick={() => setViewDoc(null)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Preview placeholder */}
              <div className={cn('mb-6 flex h-48 items-center justify-center rounded-lg', viewDoc.thumbnailColor)}>
                {(() => {
                  const CatIcon = CATEGORY_ICONS[viewDoc.category];
                  return <CatIcon className="h-16 w-16 text-stone-400" />;
                })()}
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-stone-500">File Name</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.fileName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Category</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Upload Date</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.uploadDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Uploaded By</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">Patient</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.patient}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-500">File Size</p>
                    <p className="mt-0.5 text-sm text-stone-900">{viewDoc.fileSize}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-5">
                <button className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50">
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={() => setViewDoc(null)}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">Delete Document</h3>
                  <p className="text-sm text-stone-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-stone-600">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{deleteDoc.fileName}</span>?
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteDoc(null)}
                  className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteDoc)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
