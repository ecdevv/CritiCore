// app/utility/helper.ts

/**
 * Gets the color class for a score based on its value.
 * Also has hover variants
 *
 * @param score - The score value to get the color class for.
 * @param hoverable - Whether to add hover variants to the class.
 * @returns The color class for the score className.
 */
export const getScoreColorClass = (score: number, hoverable = false) => {
  let className = '';
  if (score >= 95) className = 'bg-perfect'; // Basically Perfect Score (Bright Blue)
  else if (score >= 90) className = 'bg-excellent'; // Excellent Score (Teal Green)
  else if (score >= 80) className = 'bg-great'; // Great Score (Bright Green)
  else if (score >= 70) className = 'bg-good'; // Good Score (Medium Green)
  else if (score >= 50) className = 'bg-average'; // Average Score (Yellow)
  else if (score >= 30) className = 'bg-bad'; // Poor Score (Light Red)
  else if (score >= 0) className = 'bg-miss'; // Very Poor Score (Dark Red)
  else className = 'bg-zinc-500'; // Default (Gray/Zinc)

  if (hoverable) {
    if (score >= 95) className += ' hover:bg-perfect_hover';
    else if (score >= 90) className += ' hover:bg-excellent_hover';
    else if (score >= 80) className += ' hover:bg-great_hover';
    else if (score >= 70) className += ' hover:bg-good_hover';
    else if (score >= 50) className += ' hover:bg-average_hover';
    else if (score >= 30) className += ' hover:bg-bad_hover';
    else if (score >= 0) className += ' hover:bg-miss_hover';
    className += ' transition-all duration-100 ease-in-out';
  }

  return className;
};

/**
 * Gets the color class for a score based on its value for OpenCritic.
 *
 * @param score - The score value to get the color class for
 * @returns The color tailwind css class for the score className.
 */
export const getOpenCriticScoreClass = (score: number) => {
  if (score >= 85) return 'bg-mighty' // Positive reviews (orange)
  else if (score >= 75 && score < 85) return "bg-strong"; // Mixed reviews (purple)
  else if (score >= 65 && score < 75) return "bg-fair"; // Mixed reviews (blue)
  else if (score >= 0 && score < 65) return "bg-weak"; // Negative reviews (green)
  else return 'bg-zinc-500';
}

/**
 * Gets the color class for a score based on its value for Steam.
 *
 * @param score - The score value to get the color class for
 * @returns The color tailwind css class for the score className.
 */
export const getSteamScoreClass = (score: number) => {
  if (score >= 70) return 'text-positive' // Positive reviews (blue)
  else if (score >= 40 && score < 70) return "text-mixed"; // Mixed reviews (orange)
  else if (score < 40) return "text-negative"; // Negative reviews (red)
  else return '';
}

/**
 * Normalizes a string by converting it to lowercase, removing special characters, and trimming leading/trailing spaces.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/\//g, ' ')  // Normalize forward slashes to spaces
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, ' ') // Normalize spaces and hyphens to a single space
    .replace(/\b(edition|ultimate|definitive|game of the year|enhanced|campaign)\b/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};

/**
 * Normalizes a string by converting it to lowercase, removing special characters, replacing spaces with dashes, and trimming leading/trailing spaces.
 * Mainly used for URL slugs
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export const normalizeStringWithDashes = (str: string): string => {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/\//g, ' ')  // Normalize forward slashes to spaces
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, '-') // Normalize spaces and hyphens to a single space
    .replace(/\b(edition|ultimate|definitive|game of the year|enhanced|campaign)\b/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};


/**
 * Normalizes a string by converting it to lowercase, removing special characters, capitalizing the first letter of each word, and trimming leading/trailing spaces.
 * Used to make query comparisons closer for OpenCritic for levenshtein distance
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export const ocSearchFix = (str: string): string => {
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

/**
 * Calculates the Levenshtein distance between two strings.
 *
 * @param a - The first string.
 * @param b - The second string.
 * @returns The Levenshtein distance between the two strings.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= n; j++) {
      if (i === 0) dp[i][j] = j;
      else if (j === 0) dp[i][j] = i;
      else if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  const maxDist = m + n;
  return dp[m][n] / maxDist;
};
