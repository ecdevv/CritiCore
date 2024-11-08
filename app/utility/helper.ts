export const getScoreColorClass = (score: number) => {
  if (score >= 95) return 'bg-perfect'; // Basically Perfect Score (Bright Blue)
  if (score >= 90) return 'bg-excellent'; // Excellent Score (Teal Green)
  if (score >= 80) return 'bg-great'; // Great Score (Bright Green)
  if (score >= 70) return 'bg-good'; // Good Score (Medium Green)
  if (score >= 50) return 'bg-average'; // Average Score (Yellow)
  if (score >= 30) return 'bg-bad'; // Poor Score (Light Red)
  if (score >= 0) return 'bg-miss'; // Very Poor Score (Dark Red)
  return 'bg-zinc-500'; // Default (Gray/Zinc)
};

export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, ' ')  // Normalize spaces and hyphens to a single space
    .replace(/edition|ultimate|definitive|game of the year|enhanced|campaign/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};