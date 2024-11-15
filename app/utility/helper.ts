// app/utility/helper.ts

/** UNUSED ATM
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
 * Normalizes a string by converting it to lowercase, removing special characters, and trimming leading/trailing spaces.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export const normalizeString = (str: string, dashForSpace = false, search = false): string => {
  if (!str) return '';
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove , , , and other symbols
    .replace(/\//g, ' ')  // Normalize forward slashes to spaces
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(search ? '' : /\b(ultimate|definitive|enhanced|complete|goty|game of the year|limited|deluxe|collector\'s)\s+edition(?:\s+upgrade)?\b/gi, '')  // Remove phrases like "the ultimate edition" only if not search
    .replace(search ? '' : /\b(gold|vault|free|standard|anniversary)\s+edition(?:\s+upgrade)?\b/gi, '')  // Remove phrases like "the gold edition" only if not search
    .replace(search ? '' : /\b(pc|windows|mac|linux)\s+edition(?:\s+upgrade)?\b/gi, '')  // Remove phrases like "the pc edition" only if not search
    .replace(search ? '' : /\b(campaign|game of the year|goty)\b/gi, '')  // Remove other common suffixes only if not search
    .replace(/[\s\-]+/g, dashForSpace ? '-' : ' ') // Normalize spaces and hyphens to a single space or hyphen
    .replace(/(^-+|-+$)/g, '') // Remove leading/trailing -
    .trim();  // Remove leading/trailing spaces
};

/**
 * Normalizes a string by checking if it ends with any of the excluded suffixes.
 * If it does, it returns an empty string. Otherwise, it returns the original string.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export const filterString = (str: string): string => {
  const lowerName = str.toLowerCase();
  
  // Combine suffixes and regex patterns into one list of conditions to check
  const exclusionPatterns: Array<string | RegExp> = [
    // Suffixes to exclude
    ' demo', ' ost', ' soundtrack', ' wallpaper', ' bundle', ' dlc', ' - key', 
    ' singleplayer', ' multiplayer', ' osx', ' pc', ' mac', ' ios', ' android',
    ' (na)', ' (eu)', ' (pal)', ' (us)', ' (uk)', ' (jp)',
    ' (au)', ' (ca)', ' (fr)', ' (de)', ' (es)', ' (it)', ' (kr)', ' (cn)',
    ' (tw)', ' (sg)', ' (th)', ' (vn)', ' (br)', ' (pt)',
    
    // Regex patterns to exclude
    /\b(season|expansion)\s+pass\b/gi,
    /\b(starter|dlc)\s+pack\b/gi,
    /\b(free)\s+trial\b/gi,
    /\b(bonus)\s+content\b/gi,
    /\b(pre-order|preorder)\b/gi,
    /\b(-|cd)\s+key\b/gi,
    /\btrailer\b$/gi // Matches titles that end with "trailer"
  ];

  // Check if the string matches any exclusion pattern
  return exclusionPatterns.some(pattern => 
    typeof pattern === 'string' ? lowerName.includes(pattern) : pattern.test(lowerName)
  ) ? '' : str;
};

/**
 * Calculates the Damerau-Levenshtein distance between two strings with a modified formula
 * that takes into account the number of characters in each word.
 * i.e. Dragon Age is closer to Dragon Age: Inquisition than Dragon Rage
 *
 * @param a - The first string.
 * @param b - The second string.
 * @returns A normalized value between 0 and 1 representing the distance between the two strings.
 */
export const damerauLevenshteinDistance = (s1: string, s2: string): number => {
  const lenS1 = s1.length;
  const lenS2 = s2.length;

  // Create a distance matrix
  const d: number[][] = Array.from({ length: lenS1 + 1 }, () => Array(lenS2 + 1).fill(0));

  // Initialize the first row and column
  for (let i = 0; i <= lenS1; i++) {
      d[i][0] = i;
  }
  for (let j = 0; j <= lenS2; j++) {
      d[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= lenS1; i++) {
      for (let j = 1; j <= lenS2; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

          // Get the minimum cost of insertion, deletion, substitution, or transposition
          d[i][j] = Math.min(
              d[i - 1][j] + 1,    // Deletion
              d[i][j - 1] + 1,    // Insertion
              d[i - 1][j - 1] + cost // Substitution
          );

          // Transposition
          if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
              d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
          }
      }
  }

  // Get the final distance
  const distance = d[lenS1][lenS2];

  // Normalize the distance between 0 and 1 (higher distance = less similarity)
  const maxLength = Math.max(lenS1, lenS2);
  const normalizedDistance = distance / maxLength;

  return normalizedDistance;
};

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