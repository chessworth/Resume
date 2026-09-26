/**
 * @file assetHelper.ts
 * @description Utility function to dynamically resolve asset URLs in Vite environments.
 */

/**
 * Resolves static asset paths dynamically using Vite's ECMAScript module URL resolution.
 *
 * NOTE: The relative path string in `new URL()` must be explicit and relative to THIS utility file.
 * Assuming your assets directory is at `src/assets/`:
 *
 * @param {string} assetPath - Relative path or filename from `src/assets/` (e.g., 'projects/image.png').
 * @returns {string} Fully resolved asset URL string.
 */
export const getAssetUrl = (assetPath: string): string => {
  return new URL(`../assets/${assetPath}.png`, import.meta.url).href;
};
