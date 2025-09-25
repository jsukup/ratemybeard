/**
 * URL cleaning utility for removing problematic characters
 */

/**
 * Clean a URL by removing whitespace, newlines, and other problematic characters
 */
export function cleanUrl(url: string): string {
  if (!url) return url;
  
  return url
    .replace(/\s+/g, '')     // Remove any whitespace
    .replace(/%0A/g, '')     // Remove URL-encoded newlines  
    .replace(/%0D/g, '')     // Remove URL-encoded carriage returns
    .replace(/\n/g, '')      // Remove actual newlines
    .replace(/\r/g, '')      // Remove actual carriage returns
    .replace(/\t/g, '')      // Remove tabs
    .trim();
}