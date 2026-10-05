/**
 * Utility for resolving asset URLs across local development and GitHub Pages deployment.
 * Automatically respects Vite's configured base path (`/Savyasachi/`).
 */
export const BASE_URL: string = import.meta.env.BASE_URL || '/';

export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Avoid duplicating the base URL if already present
  if (BASE_URL !== '/' && path.startsWith(BASE_URL)) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const base = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;

  return `${base}${cleanPath}`;
}
