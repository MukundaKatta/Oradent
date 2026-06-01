import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns';

export function parseDateRange(startDate?: string, endDate?: string) {
  const start = startDate ? startOfDay(parseISO(startDate)) : undefined;
  const end = endDate ? endOfDay(parseISO(endDate)) : undefined;
  if (start && !isValid(start)) throw new Error('Invalid start date');
  if (end && !isValid(end)) throw new Error('Invalid end date');
  if (start && end && start > end) throw new Error('Start date must be before end date');
  return { start, end };
}

export function getDateFilter(start?: Date, end?: Date) {
  if (!start && !end) return undefined;
  const filter: Record<string, Date> = {};
  if (start) filter.gte = start;
  if (end) filter.lte = end;
  return filter;
}
