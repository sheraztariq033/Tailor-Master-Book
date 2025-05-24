import {format, formatRelative, parseISO, isValid} from 'date-fns';
// Optionally, import locales if you need them for formatRelative or other functions
// import { enUS, ur } from 'date-fns/locale'; // Example
// import i18next from 'i18next'; // To get current language for locale

/**
 * Formats a date string or Date object into a specified format string.
 * @param dateInput The date to format (Date object, ISO string, or timestamp number).
 * @param formatString The desired output format (e.g., 'PP', 'Pp', 'yyyy-MM-dd HH:mm').
 * @returns The formatted date string, or an empty string if the date is invalid.
 */
export const formatDate = (
  dateInput: Date | string | number | null | undefined,
  formatString: string = 'PP' // Default format e.g., "MMM d, yyyy"
): string => {
  if (!dateInput) return '';
  
  let dateToFormat: Date;
  if (typeof dateInput === 'string') {
    dateToFormat = parseISO(dateInput);
  } else {
    dateToFormat = new Date(dateInput);
  }

  if (!isValid(dateToFormat)) {
    console.warn(`Invalid date provided to formatDate: ${dateInput}`);
    return ''; // Or handle error as needed
  }
  
  try {
    return format(dateToFormat, formatString);
  } catch (error) {
    console.error(`Error formatting date: ${dateInput}`, error);
    return ''; // Or re-throw
  }
};

/**
 * Formats a date relative to the current date (e.g., "yesterday", "in 3 days").
 * @param dateInput The date to format (Date object, ISO string, or timestamp number).
 * @param baseDate The date to compare against (defaults to new Date()).
 * @returns The relative date string, or an empty string if the date is invalid.
 */
export const formatRelativeDate = (
  dateInput: Date | string | number | null | undefined,
  baseDate: Date = new Date()
): string => {
  if (!dateInput) return '';

  let dateToFormat: Date;
  if (typeof dateInput === 'string') {
    dateToFormat = parseISO(dateInput);
  } else {
    dateToFormat = new Date(dateInput);
  }

  if (!isValid(dateToFormat)) {
    console.warn(`Invalid date provided to formatRelativeDate: ${dateInput}`);
    return '';
  }

  try {
    // Example of using a locale based on i18next language (if needed)
    // const currentLang = i18next.language;
    // const locale = currentLang === 'ur' ? ur : enUS;
    // return formatRelative(dateToFormat, baseDate, { locale });
    return formatRelative(dateToFormat, baseDate);
  } catch (error) {
    console.error(`Error formatting relative date: ${dateInput}`, error);
    return '';
  }
};

/**
 * Converts a Firestore Timestamp (if that's the structure) to a Date object.
 * Handles both direct Date/string/number and Firestore-like timestamp objects.
 * @param timestamp Firestore-like timestamp or any valid Date constructor input.
 * @returns Date object or null if invalid.
 */
export const toDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        const d = new Date(timestamp);
        return isValid(d) ? d : null;
    }
    if (timestamp && typeof timestamp._seconds === 'number') { // Firestore-like timestamp
        const d = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
        return isValid(d) ? d : null;
    }
    console.warn("Invalid timestamp for toDate conversion:", timestamp);
    return null;
};

// Example: Format a date for display in "Month Day, Year, Time" format
export const formatFullDateTime = (dateInput: Date | string | number | null | undefined): string => {
  return formatDate(dateInput, 'PPpp'); // e.g., Jul 21, 2024, 10:30 AM
};

// Example: Format a date for display as "YYYY-MM-DD" (useful for inputs)
export const formatToIsoDateString = (dateInput: Date | string | number | null | undefined): string => {
  const date = toDate(dateInput);
  return date ? format(date, 'yyyy-MM-dd') : '';
};


// Add more utility functions as needed, e.g.,
// - calculateDaysDifference
// - isDateInPast/Future
// - startOfDay/endOfDay wrappers
// - etc.
