import { statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Size of a file in `public/`, formatted for a download link ("102 kB").
 * Read at build time, so the label can never drift from the file.
 */
export function publicFileSize(path: string): string {
  const bytes = statSync(join('public', path.replace(/^\/+/, ''))).size;
  const kb = bytes / 1000;
  return kb >= 1000 ? `${(kb / 1000).toFixed(1).replace('.', ',')} MB` : `${Math.round(kb)} kB`;
}
