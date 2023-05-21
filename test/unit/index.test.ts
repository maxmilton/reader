import { describe, expect, test } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('dist files', () => {
  for (const filename of [
    'icon16.png',
    'icon48.png',
    'icon128.png',
    'literata-ext.woff2',
    'literata-italic.woff2',
    'literata.woff2',
    'manifest.json',
    'reader.css',
    'reader.html',
    'reader.js',
    'trackx.js',
  ]) {
    test(`dist/${filename} exists`, async () => {
      const fdStats = await fs.stat(path.join(import.meta.dir, '../../dist', filename));
      expect(fdStats.isFile()).toBeTruthy();
    });
  }
});
