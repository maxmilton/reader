/* eslint-disable no-console, no-param-reassign */

import * as csso from 'csso';
import esbuild from 'esbuild';
import {
  decodeUTF8,
  encodeUTF8,
  minifyTemplates,
  writeFiles,
} from 'esbuild-minify-templates';
import { xcss } from 'esbuild-plugin-ekscss';
import * as lightningcss from 'lightningcss';
import { extname } from 'node:path';
import { PurgeCSS } from 'purgecss';
import { makeManifest } from './manifest.config';
import xcssConfig from './xcss.config';

const mode = Bun.env.NODE_ENV;
const dev = mode === 'development';
const manifest = makeManifest();
const release = manifest.version_name || manifest.version;

function findOutputFile(outputFiles: esbuild.OutputFile[], ext: string) {
  const index = outputFiles.findIndex((outputFile) =>
    outputFile.path.endsWith(ext),
  );
  return { file: outputFiles[index], index };
}

function makeHTML(jsPath: string, cssPath: string) {
  return `
    <!doctype html>
    <meta charset=utf-8>
    <meta name=google value=notranslate>
    <link href=literata.woff2 rel=preload as=font type=font/woff2 crossorigin>
    <link href=${cssPath} rel=stylesheet>
    <script src=trackx.js defer></script>
    <script src=${jsPath} defer></script>
  `
    .trim()
    .replaceAll(/\n\s+/g, '\n'); // remove leading whitespace
}

const analyzeMeta: esbuild.Plugin = {
  name: 'analyze-meta',
  setup(build) {
    if (!build.initialOptions.metafile) return;

    build.onEnd(
      (result) =>
        result.metafile &&
        build.esbuild.analyzeMetafile(result.metafile).then(console.log),
    );
  },
};

const minifyCSS: esbuild.Plugin = {
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
            // 'disabled',
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
            chrome: 110 << 16,
          },
        });

        for (const warning of minified.warnings) {
          console.error('CSS WARNING:', warning.message);
        }

        const minified2 = csso.minify(minified.code.toString(), {
          filename: outCSS.file.path,
          sourceMap: dev,
          usage: {
            blacklist: {
              classes: [
                'button', // #apply mapped to 'button'
                'disabled', // not actually used (as class)
              ],
            },
          },
        });

        result.outputFiles[outCSS.index].contents = encodeUTF8(minified2.css);

        if (minified2.map) {
          const outCSSMap = findOutputFile(result.outputFiles, '.css.map');
          result.outputFiles[outCSSMap.index].contents = encodeUTF8(
            minified2.map.toString(),
          );
        }
      }
    });
  },
};

const minifyJS: esbuild.Plugin = {
  name: 'minify-js',
  setup(build) {
    // if (!build.initialOptions.minify) return;
    if (build.initialOptions.write !== false) return;

    build.onEnd(async (result) => {
      if (result.outputFiles) {
        for (let index = 0; index < result.outputFiles.length; index++) {
          const file = result.outputFiles[index];

          if (extname(file.path) !== '.js') return;

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
await Bun.write('dist/manifest.json', JSON.stringify(manifest));

// Reader app HTML
await Bun.write('dist/reader.html', makeHTML('reader.js', 'reader.css'));

// Reader app
const esbuildConfig1: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/reader.js',
  platform: 'browser',
  target: ['chrome110'],
  external: ['literata-ext.woff2', 'literata-italic.woff2', 'literata.woff2'],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [
    xcss(xcssConfig),
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
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
  legalComments: 'none',
  // XXX: Comment out to keep performance markers in non-dev builds for debugging
  pure: ['performance.mark', 'performance.measure'],
};

// Error tracking
const esbuildConfig2: esbuild.BuildOptions = {
  entryPoints: ['src/trackx.ts'],
  outfile: 'dist/trackx.js',
  platform: 'browser',
  target: ['chrome110'],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [analyzeMeta, minifyJS, writeFiles()],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  write: dev,
  metafile: !dev && process.stdout.isTTY,
  logLevel: 'debug',
};

if (dev) {
  const context1 = await esbuild.context(esbuildConfig1);
  const context2 = await esbuild.context(esbuildConfig2);
  await Promise.all([context1.watch(), context2.watch()]);
} else {
  await esbuild.build(esbuildConfig1);
  await esbuild.build(esbuildConfig2);
}
