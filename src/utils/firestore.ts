/**
 * Utility functions for handling Firestore data types
 */

/**
 * Safely converts a Firestore timestamp to a Date object or ISO string
 * @param timestamp - Could be a Firestore Timestamp, Date, string, or null/undefined
 * @param format - 'date' returns Date object, 'iso' returns ISO string
 * @returns Date object, ISO string, or null if invalid
 */
export function convertFirestoreTimestamp(
  timestamp: any, 
  format: 'date' | 'iso' = 'date'
): Date | string | null {
  if (!timestamp) return null;
  
  try {
    let date: Date;
    
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      // Firestore Timestamp with seconds/nanoseconds structure
      date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    } else {
      return null;
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return format === 'iso' ? date.toISOString() : date;
  } catch (error) {
    console.warn('Error converting timestamp:', timestamp, error);
    return null;
  }
}

/**
 * Format a Firestore timestamp for display
 * @param timestamp - Could be a Firestore Timestamp, Date, string, or null/undefined
 * @param options - Formatting options
 * @returns Formatted date string or fallback
 */
export function formatFirestoreDate(
  timestamp: any,
  options: {
    format?: 'date' | 'time' | 'datetime' | 'locale';
    fallback?: string;
    locale?: string;
    timeOptions?: Intl.DateTimeFormatOptions;
  } = {}
): string {
  const {
    format = 'locale',
    fallback = 'No date set',
    locale = 'en-US',
    timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }
  } = options;
  
  const date = convertFirestoreTimestamp(timestamp, 'date') as Date;
  if (!date) return fallback;
  
  try {
    switch (format) {
      case 'date':
        return date.toLocaleDateString(locale, {timeZone: 'Asia/Kolkata'});
      case 'time':
        return date.toLocaleTimeString(locale, timeOptions);
      case 'datetime':
        return date.toLocaleString(locale, {timeZone: 'Asia/Kolkata'});
      case 'locale':
      default:
        return date.toLocaleDateString(locale, {timeZone: 'Asia/Kolkata'});
    }
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return fallback;
  }
}

/**
 * Helper to safely handle tournament data from Firestore
 * @param tournament - Raw tournament data from Firestore
 * @returns Tournament data with properly converted timestamps
 */
export function sanitizeTournamentData(tournament: any) {
  return {
    ...tournament,
    start_date: convertFirestoreTimestamp(tournament.start_date, 'iso'),
    created_at: convertFirestoreTimestamp(tournament.created_at, 'iso'),
    started_at: convertFirestoreTimestamp(tournament.started_at, 'iso'),
    ended_at: convertFirestoreTimestamp(tournament.ended_at, 'iso'),
    completed_at: convertFirestoreTimestamp(tournament.completed_at, 'iso'),
    ttl: tournament.ttl ? convertFirestoreTimestamp(tournament.ttl, 'iso') : undefined,
  };
}
