
/**
 * Normalizes a string by checking if it ends with any of the excluded suffixes.
 * If it does, it returns an empty string. Otherwise, it returns the original string.
 *
 * @param str - The string to normalize.
 * @returns The normalized string.
 */
export default function filterString(str: string): string {
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
    /\b(starter|dlc|multiplayer)\s+pack\b/gi,
    /\b(free)\s+trial\b/gi,
    /\b(bonus)\s+content\b/gi,
    /\b(pre-order|preorder)\b/gi,
    /\b(-|cd)\s+key\b/gi,
  ];

  // Check if the string matches any exclusion pattern
  return exclusionPatterns.some(pattern => 
    typeof pattern === 'string' ? lowerName.includes(pattern) : pattern.test(lowerName)
  ) ? '' : str;
};