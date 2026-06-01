import { Request, Response, NextFunction } from 'express';

export interface ActivityRecord {
  lastActive: Date;
  routes: Map<string, number>;
}

/**
 * In-memory store of user activity keyed by provider ID.
 * Tracks last-active timestamps and route access counts.
 */
const activityStore = new Map<string, ActivityRecord>();

/** Interval handle for periodic flush (if needed). */
let flushInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Middleware that tracks activity for authenticated users.
 * Updates last-active timestamp and records which routes are accessed.
 * Data is stored in-memory; call `getActivity` / `getAllActivity` to read it.
 */
export function activityTracker() {
  // Start the periodic flush cycle if not already running
  if (!flushInterval) {
    // Flush every 5 minutes (structure only -- no actual DB write)
    flushInterval = setInterval(() => {
      flushActivity();
    }, 5 * 60 * 1000);

    // Allow the process to exit even if the interval is pending
    if (flushInterval.unref) {
      flushInterval.unref();
    }
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const providerId = req.auth?.providerId;
    if (!providerId) {
      next();
      return;
    }

    const routeKey = `${req.method} ${req.baseUrl}${req.path}`;

    let record = activityStore.get(providerId);
    if (!record) {
      record = { lastActive: new Date(), routes: new Map() };
      activityStore.set(providerId, record);
    }

    record.lastActive = new Date();
    record.routes.set(routeKey, (record.routes.get(routeKey) ?? 0) + 1);

    next();
  };
}

/**
 * Get the activity record for a specific provider.
 */
export function getActivity(providerId: string): ActivityRecord | undefined {
  return activityStore.get(providerId);
}

/**
 * Get all activity records.
 */
export function getAllActivity(): Map<string, ActivityRecord> {
  return activityStore;
}

/**
 * Periodic flush placeholder.
 * In a full implementation this would persist data to the database
 * and clear the in-memory store.
 */
function flushActivity(): void {
  // Placeholder: iterate entries for potential persistence
  // For now, prune entries older than 24 hours to prevent unbounded growth
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  for (const [providerId, record] of activityStore) {
    if (record.lastActive < cutoff) {
      activityStore.delete(providerId);
    }
  }
}

/**
 * Stop the flush interval (useful for tests / graceful shutdown).
 */
export function stopActivityTracker(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}
