// app/utility/helper.ts

/**
 * Gets the color class for a score based on its value.
 * Also has hover variants
 *
 * @param score - The score value to get the color class for.
 * @param hoverable - Whether to add hover variants to the class.
 * @returns The color class for the score className.
 */
export function getScoreColorClass(score: number | null | undefined, hoverable = false) {
  let className = '';
  if (score != null) {
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
  } else {
    className = 'bg-zinc-500'; // Default (Gray/Zinc)
  }

  return className;
};

/**
 * Gets the color class for a score based on its value for OpenCritic.
 *
 * @param score - The score value to get the color class for
 * @returns The color tailwind css class for the score className.
 */
export function getOpenCriticScoreClass(score: number) {
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
export function getSteamScoreClass(score: number) {
  if (score >= 70) return 'text-positive' // Positive reviews (blue)
  else if (score >= 40 && score < 70) return "text-mixed"; // Mixed reviews (orange)
  else if (score < 40) return "text-negative"; // Negative reviews (red)
  else return '';
}