import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get color class for rating score based on value
 * @param score - Rating score (0-10)
 * @returns Tailwind color classes with accessibility considerations
 */
export function getRatingColor(score: number): string {
  if (score >= 8.5) return "text-green-700 font-bold text-lg";
  if (score >= 7.0) return "text-green-600 font-bold text-lg";
  if (score >= 5.5) return "text-yellow-600 font-bold text-lg";
  if (score >= 4.0) return "text-orange-600 font-bold text-lg";
  return "text-red-600 font-bold text-lg";
}

/**
 * Get background color class for rating score
 * @param score - Rating score (0-10)
 * @returns Tailwind background color classes
 */
export function getRatingBgColor(score: number): string {
  if (score >= 8.5) return "bg-green-50 border-green-200";
  if (score >= 7.0) return "bg-green-25 border-green-100";
  if (score >= 5.5) return "bg-yellow-50 border-yellow-200";
  if (score >= 4.0) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}
