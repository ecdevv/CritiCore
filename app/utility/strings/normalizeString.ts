/**
 * Normalizes a string by converting it to lowercase, removing special characters, and trimming leading/trailing spaces.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */

export default function normalizeString(str: string, dashForSpace = false, search = false): string {
  if (!str) return '';

  // Build a single regex for most replacements
  let normalized = str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove symbols
    .replace(/\//g, ' ')  // Normalize forward slashes to spaces
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .trim();  // Remove leading/trailing spaces

  // Remove specific phrases if `search` is false
  if (!search) {
    normalized = normalized.replace(/\b(ultimate|definitive|enhanced|complete|goty|game of the year|limited|deluxe|collector\'s)\s+edition(?:\s+upgrade)?\b/gi, '')
    .replace(/\b(gold|vault|free|standard|anniversary)\s+edition(?:\s+upgrade)?\b/gi, '')
    .replace(/\b(pc|windows|mac|linux)\s+edition(?:\s+upgrade)?\b/gi, '')
    .replace(/\b(campaign|game of the year|goty)\b/gi, '');
  }

  // Normalize spaces and hyphens to a single space or hyphen, after search replacements
  normalized = normalized.replace(/[\s\-]+/g, dashForSpace ? '-' : ' ')  // Normalize spaces and hyphens
  .replace(/(^-+|-+$)/g, '').trim();  // Remove leading/trailing '-' and spaces
  
  return normalized;
};

/** UNUSED ATM
 * Normalizes a string by converting it to lowercase, removing special characters, capitalizing the first letter of each word, and trimming leading/trailing spaces.
 * Used to make query comparisons closer for OpenCritic for levenshtein distance
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export function ocSearchFix (str: string): string {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/\//g, ' ')  // Normalize forward slashes to spaces
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, ' ') // Normalize spaces and hyphens to a single space
    .replace(/\b\w/g, m => m.toUpperCase())  // Capitalize the first letter of each word
    .replace(/\b(of|the|a|an)\b/gi, m => m.toLowerCase())  // Lowercase articles
    .replace(/\b(edition|ultimate|definitive|game of the year|enhanced|campaign)\b/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};