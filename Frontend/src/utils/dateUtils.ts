import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);

// Get user's timezone
export const getUserTimezone = (): string => {
  return dayjs.tz.guess();
};

// Format date for display (local timezone)
export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    // Parse the date string as UTC and convert to local time using native Date
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Format date for datetime-local input (local timezone)
export const formatDateTimeLocal = (date: dayjs.Dayjs | string | Date): string => {
  const dayjsDate = dayjs(date);
  return dayjsDate.format('YYYY-MM-DDTHH:mm');
};

// Convert local datetime to UTC for backend
export const convertLocalToUTC = (localDateTime: string): string => {
  // datetime-local input is in format "YYYY-MM-DDTHH:MM" (local time)
  return dayjs(localDateTime).utc().toISOString();
};

// Convert Date object to UTC for backend (for react-datepicker)
export const convertDateToUTC = (date: Date): string => {
  return dayjs(date).utc().toISOString();
};

// Convert Date object to local datetime string for datetime-local input
export const convertDateToLocalString = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DDTHH:mm');
};

// Convert UTC datetime to local for display
export const convertUTCToLocal = (utcDateTime: string): dayjs.Dayjs => {
  return dayjs.utc(utcDateTime).local();
};

// Format time remaining
export const formatTimeRemaining = (endTime: string): string => {
  const now = dayjs();
  const end = dayjs(endTime);
  
  if (end.isBefore(now)) {
    return 'Ended';
  }
  
  const diff = end.diff(now);
  const duration = dayjs.duration(diff);
  
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Check if auction is active
export const isAuctionActive = (startTime: string, endTime: string): boolean => {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  
  return now.isAfter(start) && now.isBefore(end);
};

// Check if auction has started
export const isAuctionStarted = (startTime: string): boolean => {
  return dayjs().isAfter(dayjs(startTime));
};

// Check if auction has ended
export const isAuctionEnded = (endTime: string): boolean => {
  return dayjs().isAfter(dayjs(endTime));
};

// Get auction status based on current time
export const getAuctionStatus = (startTime: string, endTime: string): 'Scheduled' | 'Active' | 'Ended' => {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  
  if (now.isBefore(start)) {
    return 'Scheduled';
  } else if (now.isAfter(end)) {
    return 'Ended';
  } else {
    return 'Active';
  }
};

// Get default start time (current time + 1 minute)
export const getDefaultStartTime = (): string => {
  return dayjs().add(1, 'minute').format('YYYY-MM-DDTHH:mm');
};

// Get default end time (start time + 5 minutes)
export const getDefaultEndTime = (startTime?: string): string => {
  const start = startTime ? dayjs(startTime) : dayjs().add(1, 'minute');
  return start.add(5, 'minutes').format('YYYY-MM-DDTHH:mm');
};

// Validate date range
export const validateDateRange = (startTime: string, endTime: string): { isValid: boolean; error?: string } => {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  
  if (start.isBefore(now)) {
    return { isValid: false, error: 'Start time cannot be in the past' };
  }
  
  if (end.isBefore(start)) {
    return { isValid: false, error: 'End time must be after start time' };
  }
  
  if (end.isBefore(now)) {
    return { isValid: false, error: 'End time cannot be in the past' };
  }
  
  return { isValid: true };
};

// Get timezone info for debugging
export const getTimezoneInfo = () => {
  const now = dayjs();
  return {
    timezone: getUserTimezone(),
    localTime: now.format('YYYY-MM-DD HH:mm:ss'),
    utcTime: now.utc().format('YYYY-MM-DD HH:mm:ss'),
    offset: now.format('Z'),
    offsetMinutes: now.utcOffset()
  };
};

// Format date for API (always UTC)
export const formatDateForAPI = (date: dayjs.Dayjs | string | Date): string => {
  return dayjs(date).utc().toISOString();
};

// Parse date from API (assume UTC)
export const parseDateFromAPI = (dateString: string): dayjs.Dayjs => {
  return dayjs.utc(dateString);
};

// Get relative time (e.g., "2 hours ago", "in 3 days")
export const getRelativeTime = (dateString: string): string => {
  return dayjs(dateString).fromNow();
};

// Check if two dates are the same day
export const isSameDay = (date1: string, date2: string): boolean => {
  return dayjs(date1).isSame(dayjs(date2), 'day');
};

// Add time to a date
export const addTime = (dateString: string, amount: number, unit: dayjs.ManipulateType): string => {
  return dayjs(dateString).add(amount, unit).toISOString();
};

// Subtract time from a date
export const subtractTime = (dateString: string, amount: number, unit: dayjs.ManipulateType): string => {
  return dayjs(dateString).subtract(amount, unit).toISOString();
};
