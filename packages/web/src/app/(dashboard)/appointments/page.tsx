'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR as dateFnsPtBR } from 'date-fns/locale';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import { CalendarView } from '@/components/appointments/CalendarView';
import { AppointmentModal } from '@/components/appointments/AppointmentModal';
import { ChairView } from '@/components/appointments/ChairView';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  providerColor: string;
  chairId: string;
  chairName: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
}

type ViewMode = 'calendar' | 'chair';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<string>('timeGridWeek');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newSlotData, setNewSlotData] = useState<{ date: string; time: string } | null>(null);

  const fetchAppointments = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiGet<Appointment[]>(
        `/api/appointments?start=${start}&end=${end}`
      );
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      'yyyy-MM-dd'
    );
    const end = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      'yyyy-MM-dd'
    );
    fetchAppointments(start, end);
  }, [currentDate, fetchAppointments]);

  const handleEventClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNewSlotData(null);
    setModalOpen(true);
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedAppointment(null);
    setNewSlotData({ date, time });
    setModalOpen(true);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setNewSlotData(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    setNewSlotData(null);
  };

  const handleSave = () => {
    handleModalClose();
    const start = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      'yyyy-MM-dd'
    );
    const end = format(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      'yyyy-MM-dd'
    );
    fetchAppointments(start, end);
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else {
      const offset = direction === 'prev' ? -1 : 1;
      if (calendarView === 'dayGridMonth') {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
      } else if (calendarView === 'timeGridWeek') {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentDate(newDate);
      } else {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="glass flex items-center gap-1 rounded-full p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-teal-600 text-white shadow-apple-sm'
                  : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
              )}
            >
              <Calendar className="h-4 w-4" />
              {t('appointments.calendar', 'Calendário')}
            </button>
            <button
              onClick={() => setViewMode('chair')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'chair'
                  ? 'bg-teal-600 text-white shadow-apple-sm'
                  : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {t('appointments.chairView', 'Visualização por cadeira')}
            </button>
          </div>

          {viewMode === 'calendar' && (
            <div className="glass flex items-center gap-1 rounded-full p-1">
              <button
                onClick={() => setCalendarView('timeGridDay')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'timeGridDay'
                    ? 'bg-teal-600 text-white shadow-apple-sm'
                    : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
                )}
              >
                {t('appointments.day', 'Dia')}
              </button>
              <button
                onClick={() => setCalendarView('timeGridWeek')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'timeGridWeek'
                    ? 'bg-teal-600 text-white shadow-apple-sm'
                    : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
                )}
              >
                {t('appointments.week', 'Semana')}
              </button>
              <button
                onClick={() => setCalendarView('dayGridMonth')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  calendarView === 'dayGridMonth'
                    ? 'bg-teal-600 text-white shadow-apple-sm'
                    : 'text-stone-600 hover:bg-stone-900/5 dark:text-stone-400 dark:hover:bg-white/5'
                )}
              >
                {t('appointments.month', 'Mês')}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              aria-label={t('appointments.previousPeriod', 'Período anterior')}
              className="rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-1.5 text-stone-600 dark:text-stone-300 shadow-apple-sm backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 shadow-apple-sm backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-white/10"
            >
              {t('appointments.today', 'Hoje')}
            </button>
            <button
              onClick={() => navigateDate('next')}
              aria-label={t('appointments.nextPeriod', 'Próximo período')}
              className="rounded-full border border-stone-200/70 dark:border-white/10 bg-white/70 dark:bg-white/5 p-1.5 text-stone-600 dark:text-stone-300 shadow-apple-sm backdrop-blur-sm transition-colors hover:bg-white dark:hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <h2 className="ml-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
              {format(currentDate, 'MMMM yyyy', { locale: dateFnsPtBR })}
            </h2>
          </div>
        </div>

        <button
          onClick={handleNewAppointment}
          className="flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-apple-sm transition-all hover:bg-teal-700 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          {t('appointments.new', 'Nova consulta')}
        </button>
      </div>

      {/* Calendar / Chair View */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex h-[600px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              <p className="text-sm text-stone-500 dark:text-stone-400">{t('appointments.loading', 'Carregando consultas...')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-[600px] items-center justify-center px-6 text-center text-sm text-stone-500 dark:text-stone-400">{t('appointments.loadError', 'Não foi possível carregar as consultas. Tente novamente.')}</div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            currentDate={currentDate}
            view={calendarView}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
            onDateChange={setCurrentDate}
            onViewChange={setCalendarView}
          />
        ) : (
          <ChairView
            appointments={appointments}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onSlotClick={handleSlotClick}
          />
        )}
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        appointment={selectedAppointment}
        initialDate={newSlotData?.date}
        initialTime={newSlotData?.time}
      />
    </div>
  );
}
