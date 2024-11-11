import { parse, format } from 'date-fns'
import { enUS, fr, zhCN } from 'date-fns/locale'

/**
 * Formats a date string into "MMMM d, yyyy" (e.g., "February 24, 2022").
 * Handles dates in multiple languages and formats.
 *
 * @param dateStr - The date string to be parsed and formatted.
 * @returns The formatted date string in "MMMM d, yyyy" format or "Invalid date" if parsing fails.
 */

// Define possible formats and locales to try
const formats = [
  'MMM dd, yyyy',     // e.g., "Feb 24, 2022"
  'dd MMM, yyyy',     // e.g., "24 Feb, 2022"
  'dd MMM yyyy',      // e.g., "24 Feb 2022"
  'dd MMM. yyyy',     // e.g., "24 févr. 2022"
  'MMMM dd, yyyy',    // e.g., "February 24, 2022"
  'MMM dd yyyy',      // e.g., "Feb 24 2022"
  'MMM. dd, yyyy',    // e.g., "Févr. 24, 2022"
  'd MMM yyyy',       // e.g., "4 Mar 2022"
  'd MMM, yyyy',      // e.g., "4 Mar, 2022"
  'dd MMMM yyyy',     // e.g., "24 February 2022"
  'MMMM dd yyyy',     // e.g., "February 24 2022"
  'dd/MM/yyyy',       // e.g., "24/02/2022"
  'd/MM/yyyy',        // e.g., "4/02/2022"
  'yyyy-MM-dd',       // e.g., "2022-02-24"
  'yyyy年MM月dd日',    // e.g., "2022年02月24日" (Chinese)
  'dd.MM.yyyy',       // e.g., "24.02.2022" (German)
  'dd-MM-yyyy'        // e.g., "24-02-2022" (Dutch)
];

export function formatDate(dateStr: string): string {
  let parsedDate: Date | null = null;

  for (const fmt of formats) {
    try {
      // Try parsing with English locale first
      parsedDate = parse(dateStr, fmt, new Date(), { locale: enUS });
      if (!isNaN(parsedDate.getTime())) break;
    } catch (error) {
      // Try the next format
    }

    // Try parsing with French locale if English fails
    try {
      parsedDate = parse(dateStr, fmt, new Date(), { locale: fr });
      if (!isNaN(parsedDate.getTime())) break;
    } catch (error) {
      // Try the next format
    }

    // Try parsing with Chinese locale if French fails
    try {
      parsedDate = parse(dateStr, fmt, new Date(), { locale: zhCN });
      if (!isNaN(parsedDate.getTime())) break;
    } catch (error) {
      // Try the next format
    }
  }

  return parsedDate && !isNaN(parsedDate.getTime())
    ? format(parsedDate, 'MMMM d, yyyy', { locale: enUS })
    : 'Invalid date';
}