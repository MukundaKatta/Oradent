'use client';

import { useState, useCallback } from 'react';
import {
  Shield,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsuranceInfo {
  company: string;
  plan: string;
  memberId: string;
  groupNumber: string;
  subscriber: string;
  relationship: string;
  verificationStatus: 'verified' | 'pending' | 'expired' | 'unverified';
}

interface InsuranceCardProps {
  primary?: InsuranceInfo;
  secondary?: InsuranceInfo;
  onVerify?: (type: 'primary' | 'secondary') => void;
  className?: string;
}

const STATUS_CONFIG = {
  verified: { icon: CheckCircle, label: 'Verified', style: 'bg-emerald-100 text-emerald-700' },
  pending: { icon: Clock, label: 'Pending', style: 'bg-amber-100 text-amber-700' },
  expired: { icon: AlertCircle, label: 'Expired', style: 'bg-red-100 text-red-700' },
  unverified: { icon: AlertCircle, label: 'Unverified', style: 'bg-stone-100 text-stone-600' },
} as const;

function CopyMemberIdButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center text-stone-400 hover:text-stone-600 transition-colors"
      title="Copy Member ID"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function InsuranceSection({
  info,
  type,
  onVerify,
}: {
  info: InsuranceInfo;
  type: 'primary' | 'secondary';
  onVerify?: () => void;
}) {
  const status = STATUS_CONFIG[info.verificationStatus];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900 capitalize">
          {type} Insurance
        </h3>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            status.style
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <span className="block text-xs text-stone-500">Company</span>
          <span className="text-sm font-medium text-stone-900">{info.company}</span>
        </div>
        <div>
          <span className="block text-xs text-stone-500">Plan</span>
          <span className="text-sm font-medium text-stone-900">{info.plan}</span>
        </div>
        <div>
          <span className="block text-xs text-stone-500">Member ID</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900">
            {info.memberId}
            <CopyMemberIdButton text={info.memberId} />
          </span>
        </div>
        <div>
          <span className="block text-xs text-stone-500">Group Number</span>
          <span className="text-sm font-medium text-stone-900">{info.groupNumber}</span>
        </div>
        <div>
          <span className="block text-xs text-stone-500">Subscriber</span>
          <span className="text-sm font-medium text-stone-900">{info.subscriber}</span>
        </div>
        <div>
          <span className="block text-xs text-stone-500">Relationship</span>
          <span className="text-sm font-medium text-stone-900 capitalize">
            {info.relationship}
          </span>
        </div>
      </div>

      {onVerify && info.verificationStatus !== 'verified' && (
        <button
          onClick={onVerify}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Verify
        </button>
      )}
    </div>
  );
}

export function InsuranceCard({ primary, secondary, onVerify, className }: InsuranceCardProps) {
  if (!primary && !secondary) {
    return (
      <div
        className={cn(
          'rounded-xl border border-stone-200 bg-white p-6 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-stone-400" />
          <h2 className="text-lg font-semibold text-stone-900">Insurance</h2>
        </div>
        <p className="text-sm text-stone-500">No insurance information on file.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-stone-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-stone-900">Insurance</h2>
      </div>

      <div className="space-y-6">
        {primary && (
          <InsuranceSection
            info={primary}
            type="primary"
            onVerify={onVerify ? () => onVerify('primary') : undefined}
          />
        )}
        {primary && secondary && (
          <div className="border-t border-stone-200" />
        )}
        {secondary && (
          <InsuranceSection
            info={secondary}
            type="secondary"
            onVerify={onVerify ? () => onVerify('secondary') : undefined}
          />
        )}
      </div>
    </div>
  );
}
