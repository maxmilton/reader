import { describe, expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';

describe('dist files', () => {
  // XXX: Files with unknown type (e.g., symlinks) fall back to the default
  // "application/octet-stream". Bun.file() does not resolve symlinks so it's
  // safe to infer that all these files are therefore regular files.
  const distFiles: [filename: string, type: string][] = [
    ['icon16.png', 'image/png'],
    ['icon48.png', 'image/png'],
    ['icon128.png', 'image/png'],
    ['literata-ext.woff2', 'font/woff2'],
    ['literata-italic.woff2', 'font/woff2'],
    ['literata.woff2', 'font/woff2'],
    ['manifest.json', 'application/json;charset=utf-8'],
    ['reader.css', 'text/css'],
    ['reader.html', 'text/html;charset=utf-8'],
    ['reader.js', 'text/javascript;charset=utf-8'],
    ['trackx.js', 'text/javascript;charset=utf-8'],
  ];

  for (const [filename, type] of distFiles) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    test(`file "dist/${filename}" exists with correct type`, () => {
      const file = Bun.file(`dist/${filename}`);
      expect(file.type).toBe(type);
      expect(file.size).toBeGreaterThan(0);
    });
  }

  test('contains no extra files', async () => {
    const distDir = await readdir('dist');
    expect(distDir).toHaveLength(distFiles.length);
  });
});
