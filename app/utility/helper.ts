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

export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()  // Lowercase for case insensitivity
    .replace(/[\u00A9\u2122\u00AE\u2013\u2014\u2020\u2021]/g, '')  // Remove ©, ™, ®, and other symbols
    .replace(/[^\w\s-]/g, '')  // Remove any non-word characters, except for spaces and hyphens
    .replace(/[\s\-]+/g, ' ')  // Normalize spaces and hyphens to a single space
    .replace(/edition|ultimate|definitive|game of the year|enhanced|campaign/gi, '')  // Remove common suffixes
    .trim();  // Remove leading/trailing spaces
};