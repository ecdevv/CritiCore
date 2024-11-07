export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, ' ')  // Normalize spaces and hyphens to a single space
    .replace(/edition|ultimate|definitive|game of the year|enhanced|campaign/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};

