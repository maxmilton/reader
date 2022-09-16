/* eslint-disable import/no-extraneous-dependencies, no-console, no-param-reassign */

import esbuild from 'esbuild';
import {
  decodeUTF8,
  encodeUTF8,
  minifyTemplates,
  writeFiles,
} from 'esbuild-minify-templates';
import { xcss } from 'esbuild-plugin-ekscss';
import * as lightningcss from 'lightningcss';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PurgeCSS } from 'purgecss';
import manifest from './manifest.config.mjs';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const dir = path.resolve(); // loose alternative to __dirname in node ESM
const release = manifest.version_name || manifest.version;

/**
 * @param {esbuild.OutputFile[]} outputFiles
 * @param {string} ext - File extension to match.
 * @returns {{ file: esbuild.OutputFile; index: number; }}
 */
function findOutputFile(outputFiles, ext) {
  const index = outputFiles.findIndex((outputFile) => outputFile.path.endsWith(ext));
  return { file: outputFiles[index], index };
}

/** @type {esbuild.Plugin} */
const analyzeMeta = {
  name: 'analyze-meta',
  setup(build) {
    if (!build.initialOptions.metafile) return;

    build.onEnd(
      (result) => result.metafile
        && build.esbuild.analyzeMetafile(result.metafile).then(console.log),
    );
  },
};

/**
 * @param {string} jsPath
 * @param {string} cssPath
 */
function makeHTML(jsPath, cssPath) {
  return `<!doctype html>
<meta charset=utf-8>
<meta name=google value=notranslate>
<link href=literata.woff2 rel=preload as=font type=font/woff2 crossorigin>
<link href=${cssPath} rel=stylesheet>
<script src=trackx.js defer></script>
<script src=${jsPath} defer></script>`;
}

/** @type {esbuild.Plugin} */
const minifyCSS = {
  name: 'minify-css',
  setup(build) {
    // if (!build.initialOptions.minify) return;
    if (build.initialOptions.write !== false) return;

    build.onEnd(async (result) => {
      if (result.outputFiles) {
        const outJS = findOutputFile(result.outputFiles, '.js');
        const outCSS = findOutputFile(result.outputFiles, '.css');

        const purged = await new PurgeCSS().purge({
          content: [{ extension: '.js', raw: decodeUTF8(outJS.file.contents) }],
          css: [{ raw: decodeUTF8(outCSS.file.contents) }],
          sourceMap: dev,
          safelist: ['html', 'body'],
          blocklist: [
            // XXX: Remember to remove if actually using the element tag
            'article',
            'aside',
            'blockquote',
            'break',
            'canvas',
            'dd',
            'disabled',
            'dt',
            'embed',
            'figcaption',
            'figure',
            'footer',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'header',
            'hgroup',
            'hr',
            'iframe',
            'img',
            'input',
            'link',
            'main',
            'nav',
            'ol',
            'pre',
            'section',
            'select',
            'source',
            'svg',
            'table',
            'textarea',
            'ul',
          ],
        });
        const minified = lightningcss.transform({
          filename: outCSS.file.path,
          code: Buffer.from(purged[0].css),
          minify: true,
          sourceMap: dev,
          targets: {
            // eslint-disable-next-line no-bitwise
            chrome: 104 << 16,
          },
        });

        for (const warning of minified.warnings) {
          console.error('CSS WARNING:', warning.message);
        }

        result.outputFiles[outCSS.index].contents = encodeUTF8(
          minified.code.toString(),
        );
      }
    });
  },
};

/** @type {esbuild.Plugin} */
const minifyJS = {
  name: 'minify-js',
  setup(build) {
    // if (!build.initialOptions.minify) return;
    if (build.initialOptions.write !== false) return;

    build.onEnd(async (result) => {
      if (result.outputFiles) {
        for (let index = 0; index < result.outputFiles.length; index++) {
          const file = result.outputFiles[index];

          if (path.extname(file.path) !== '.js') return;

          // eslint-disable-next-line no-await-in-loop
          const out = await build.esbuild.transform(decodeUTF8(file.contents), {
            loader: 'js',
            minify: true,
            // target: build.initialOptions.target,
          });

          result.outputFiles[index].contents = encodeUTF8(out.code);
        }
      }
    });
  },
};

// Extension manifest
await fs.writeFile(
  path.join(dir, 'dist', 'manifest.json'),
  JSON.stringify(manifest),
);

// Reader app HTML
await fs.writeFile(
  path.join(dir, 'dist/reader.html'),
  makeHTML('reader.js', 'reader.css'),
  'utf8',
);

// Reader app
await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/reader.js',
  platform: 'browser',
  target: ['chrome104'],
  external: ['literata-ext.woff2', 'literata-italic.woff2', 'literata.woff2'],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [
    xcss(),
    analyzeMeta,
    minifyTemplates(),
    minifyCSS,
    minifyJS,
    writeFiles(),
  ],
  bundle: true,
  // XXX: Do not minifySyntax here, it breaks \n in strings after minifyJS
  // minify: !dev,
  mangleProps: /_refs|collect/,
  sourcemap: dev,
  watch: dev,
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
  legalComments: 'none',
  // XXX: Comment out to keep performance markers in non-dev builds for debugging
  pure: ['performance.mark', 'performance.measure'],
});

// Error tracking
await esbuild.build({
  entryPoints: ['src/trackx.ts'],
  outfile: 'dist/trackx.js',
  platform: 'browser',
  target: ['chrome104'],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [analyzeMeta, minifyJS, writeFiles()],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  watch: dev,
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
});
