'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  PhoneOff,
  PhoneMissed,
  Send,
  RefreshCw,
  Users,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type ConfirmationStatus = 'unconfirmed' | 'confirmed' | 'voicemail' | 'no_answer';

interface AppointmentToConfirm {
  id: string;
  patientName: string;
  phone: string;
  email: string;
  time: string;
  provider: string;
  procedure: string;
  status: ConfirmationStatus;
}

// ═══════════════════ CONSTANTS ═══════════════════

const STATUS_CONFIG: Record<ConfirmationStatus, { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  unconfirmed: { label: 'Unconfirmed', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
  voicemail: { label: 'Left Voicemail', bg: 'bg-blue-50', text: 'text-blue-700', icon: PhoneOff },
  no_answer: { label: 'No Answer', bg: 'bg-red-50', text: 'text-red-700', icon: PhoneMissed },
};

// ═══════════════════ MOCK DATA ═══════════════════

const INITIAL_APPOINTMENTS: AppointmentToConfirm[] = [
  { id: '1', patientName: 'Sarah Johnson', phone: '(555) 123-4567', email: 'sarah.j@email.com', time: '8:00 AM', provider: 'Dr. Smith', procedure: 'Crown Prep - #14', status: 'unconfirmed' },
  { id: '2', patientName: 'Michael Chen', phone: '(555) 234-5678', email: 'mchen@email.com', time: '8:30 AM', provider: 'Dr. Williams', procedure: 'Root Canal - #19', status: 'confirmed' },
  { id: '3', patientName: 'Emily Rodriguez', phone: '(555) 345-6789', email: 'emily.r@email.com', time: '9:00 AM', provider: 'Dr. Smith', procedure: 'Prophylaxis', status: 'unconfirmed' },
  { id: '4', patientName: 'James Wilson', phone: '(555) 456-7890', email: 'jwilson@email.com', time: '9:30 AM', provider: 'Dr. Johnson', procedure: 'Composite Filling - #5', status: 'voicemail' },
  { id: '5', patientName: 'Lisa Thompson', phone: '(555) 567-8901', email: 'lisa.t@email.com', time: '10:00 AM', provider: 'Dr. Williams', procedure: 'Periodic Exam', status: 'unconfirmed' },
  { id: '6', patientName: 'David Park', phone: '(555) 678-9012', email: 'dpark@email.com', time: '10:30 AM', provider: 'Dr. Smith', procedure: 'SRP - Quad 1', status: 'no_answer' },
  { id: '7', patientName: 'Amanda Foster', phone: '(555) 789-0123', email: 'afoster@email.com', time: '11:00 AM', provider: 'Dr. Johnson', procedure: 'Extraction - #32', status: 'unconfirmed' },
  { id: '8', patientName: 'Robert Kim', phone: '(555) 890-1234', email: 'rkim@email.com', time: '11:30 AM', provider: 'Dr. Williams', procedure: 'Crown Delivery - #30', status: 'confirmed' },
  { id: '9', patientName: 'Jennifer Martinez', phone: '(555) 901-2345', email: 'jmartinez@email.com', time: '1:00 PM', provider: 'Dr. Smith', procedure: 'Veneer Consult', status: 'unconfirmed' },
  { id: '10', patientName: 'William Taylor', phone: '(555) 012-3456', email: 'wtaylor@email.com', time: '1:30 PM', provider: 'Dr. Johnson', procedure: 'Prophylaxis', status: 'unconfirmed' },
  { id: '11', patientName: 'Catherine Lee', phone: '(555) 111-2222', email: 'clee@email.com', time: '2:00 PM', provider: 'Dr. Williams', procedure: 'Night Guard Delivery', status: 'voicemail' },
  { id: '12', patientName: 'Thomas Brown', phone: '(555) 222-3333', email: 'tbrown@email.com', time: '2:30 PM', provider: 'Dr. Smith', procedure: 'Implant Check', status: 'unconfirmed' },
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function AppointmentConfirmationPage() {
  const [appointments, setAppointments] = useState<AppointmentToConfirm[]>(INITIAL_APPOINTMENTS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(300);

  // Auto-refresh timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          setLastRefresh(new Date());
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = useCallback((id: string, status: ConfirmationStatus) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
  }, []);

  const markAllConfirmed = useCallback(() => {
    setAppointments((prev) =>
      prev.map((apt) => ({ ...apt, status: 'confirmed' as ConfirmationStatus }))
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
    setSecondsUntilRefresh(300);
  }, []);

  const statusCounts = appointments.reduce(
    (acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatRefreshTime = () => {
    const mins = Math.floor(secondsUntilRefresh / 60);
    const secs = secondsUntilRefresh % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Appointment Confirmation</h1>
          <p className="mt-1 text-sm text-stone-500">
            Tomorrow&apos;s appointments needing confirmation &middot; {appointments.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Auto-refresh in {formatRefreshTime()}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(Object.entries(STATUS_CONFIG) as [ConfirmationStatus, typeof STATUS_CONFIG[ConfirmationStatus]][]).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2.5', cfg.bg)}>
                  <Icon className={cn('h-5 w-5', cfg.text)} />
                </div>
                <div>
                  <p className="text-sm text-stone-500">{cfg.label}</p>
                  <p className="text-xl font-bold text-stone-900">{statusCounts[status] || 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            // Simulate sending reminders
            setAppointments((prev) =>
              prev.map((apt) =>
                apt.status === 'unconfirmed' ? { ...apt, status: 'voicemail' as ConfirmationStatus } : apt
              )
            );
          }}
          className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Send className="h-4 w-4" />
          Send All Reminders
        </button>
        <button
          onClick={markAllConfirmed}
          className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          <CheckCircle className="h-4 w-4" />
          Mark All Confirmed
        </button>
      </div>

      {/* Appointments List */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-stone-400" />
            <h2 className="text-base font-semibold text-stone-900">Tomorrow&apos;s Appointments</h2>
          </div>
        </div>
        <div className="divide-y divide-stone-100">
          {appointments.map((apt) => {
            const statusCfg = STATUS_CONFIG[apt.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div key={apt.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-center">
                    <p className="text-sm font-semibold text-stone-900">{apt.time}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900">{apt.patientName}</p>
                    <p className="text-xs text-stone-500">{apt.procedure} &middot; {apt.provider}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {apt.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {apt.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', statusCfg.bg, statusCfg.text)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusCfg.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateStatus(apt.id, 'no_answer')}
                      title="Call"
                      className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'voicemail')}
                      title="Text"
                      className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'voicemail')}
                      title="Email"
                      className="rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, 'confirmed')}
                      title="Mark Confirmed"
                      className="rounded-md p-2 text-stone-400 transition-colors hover:bg-green-50 hover:text-green-600"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
