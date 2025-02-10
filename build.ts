/* eslint-disable no-await-in-loop, no-bitwise, no-console */

import { basename } from 'node:path'; // eslint-disable-line unicorn/import-style
import type { BuildArtifact, BunPlugin } from 'bun';
import * as csso from 'csso';
import * as xcss from 'ekscss';
import type { XCSSCompileOptions } from 'ekscss';
import * as lightningcss from 'lightningcss';
import { PurgeCSS, type RawContent } from 'purgecss';
import * as terser from 'terser';
import type { MinifyOptions } from 'terser';
import { createManifest } from './manifest.config';
import xcssConfig from './xcss.config';

const mode = Bun.env.NODE_ENV;
const dev = mode === 'development';

function xcssPlugin(config: XCSSCompileOptions): BunPlugin {
  return {
    name: 'xcss',
    setup(build) {
      build.onLoad({ filter: /\.xcss$/ }, async (args) => {
        const source = await Bun.file(args.path).text();
        const compiled = xcss.compile(source, {
          from: args.path,
          globals: config.globals,
          plugins: config.plugins,
        });

        for (const warning of compiled.warnings) {
          console.error('[XCSS]', warning.message);

          if (warning.file) {
            console.log(
              `  at ${[warning.file, warning.line, warning.column]
                .filter(Boolean)
                .join(':')}`,
            );
          }
        }

        return { contents: compiled.css, loader: 'css' };
      });
    },
  };
}

function makeHTML() {
  return `
    <!doctype html>
    <meta charset=utf-8>
    <meta name=google value=notranslate>
    <link href=literata.woff2 rel=preload as=font type=font/woff2 crossorigin>
    <link href=reader.css rel=stylesheet>
    <script src=health.js defer></script>
    <script src=reader.js defer></script>
  `
    .trim()
    .replaceAll(/\n\s+/g, '\n'); // remove leading whitespace
}

async function minifyCSS(artifacts: BuildArtifact[]) {
  const content: RawContent[] = [];
  const purgecss = new PurgeCSS();
  const encoder = new TextEncoder();

  for (const artifact of artifacts) {
    if (artifact.kind === 'entry-point' || artifact.kind === 'chunk') {
      content.push({ extension: '.js', raw: await artifact.text() });
    }
  }

  for (const artifact of artifacts) {
    if (artifact.kind === 'asset' && artifact.path.endsWith('.css')) {
      const filename = basename(artifact.path);
      const source = await artifact.text();
      const purged = await purgecss.purge({
        content,
        css: [
          {
            raw: source
              // HACK: Workaround for JS style sourcemap comments rather than CSS.
              //  ↳ This is a bug in bun: https://github.com/oven-sh/bun/issues/15532
              .replace(/\/\/# debugId=[\w]+\n/, '')
              .replace(
                /\/\/# sourceMappingURL=([-\w.]+\.css\.map)\n?$/,
                '/*# sourceMappingURL=$1 */',
              ),
          },
        ],
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
          // 'footer',
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
        filename,
        code: encoder.encode(purged[0].css),
        minify: true,
        targets: { chrome: 123 << 16 }, // matches manifest minimum_chrome_version
      });

      for (const warning of minified.warnings) {
        console.error(`[LightningCSS] ${warning.type}:`, warning.message);
        console.log(
          `  at ${warning.loc.filename}:${String(warning.loc.line)}:${String(warning.loc.column)}`,
        );
        if (warning.value) {
          console.log(warning.value);
        }
      }

      const minified2 = csso.minify(minified.code.toString(), {
        filename,
        forceMediaMerge: true, // somewhat unsafe
        usage: {
          blacklist: {
            classes: [
              'button', // #apply mapped to 'button'
              'disabled', // not actually used (as class)
            ],
          },
        },
        // debug: true,
      });

      await Bun.write(artifact.path, minified2.css);
    }
  }
}

async function minifyJS(
  artifacts: BuildArtifact[],
  options?: Omit<MinifyOptions, 'sourceMap'>,
): Promise<void> {
  for (const artifact of artifacts) {
    if (artifact.kind === 'entry-point' || artifact.kind === 'chunk') {
      const source = await artifact.text();
      const result = await terser.minify(source, {
        ecma: 2020,
        module: true,
        compress: {
          comparisons: false,
          negate_iife: false,
          reduce_funcs: false, // prevent functions being inlined
          hoist_funs: true,
          passes: 3,
          // XXX: Comment out to keep performance markers for debugging
          pure_funcs: ['performance.mark', 'performance.measure'],
        },
        mangle: {
          properties: {
            regex: /^\$\$/,
          },
        },
        format: {
          wrap_func_args: true,
          wrap_iife: true,
          semicolons: false, // better debugging with near-zero overhead
        },
        ...options,
      });

      await Bun.write(artifact.path, result.code!);
    }
  }
}

console.time('prebuild');
await Bun.$`rm -rf dist`;
await Bun.$`cp -r static dist`;
console.timeEnd('prebuild');

// Extension manifest
console.time('manifest');
const manifest = createManifest();
const release = manifest.version_name ?? manifest.version;
await Bun.write('dist/manifest.json', JSON.stringify(manifest));
console.timeEnd('manifest');

// Reader app HTML
console.time('html');
await Bun.write('dist/reader.html', makeHTML());
console.timeEnd('html');

// Health insights (exception monitoring)
console.time('build:1');
const out1 = await Bun.build({
  entrypoints: ['src/health.ts'],
  outdir: 'dist',
  target: 'browser',
  format: 'iife', // must not mutate global scope
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  minify: !dev,
  sourcemap: dev ? 'linked' : 'none',
  banner: '"use strict";',
});
console.timeEnd('build:1');
console.log(out1.outputs);
if (!out1.success) throw new AggregateError(out1.logs, 'Build failed');

// Reader app JS
console.time('build:2');
const out2 = await Bun.build({
  entrypoints: ['src/reader.ts'],
  outdir: 'dist',
  target: 'browser',
  external: ['literata-ext.woff2', 'literata-italic.woff2', 'literata.woff2'],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  loader: {
    '.svg': 'text',
  },
  plugins: [xcssPlugin(xcssConfig)],
  emitDCEAnnotations: true, // for terser
  minify: !dev,
  sourcemap: dev ? 'linked' : 'none',
});
console.timeEnd('build:2');
console.log(out2.outputs);
if (!out2.success) throw new AggregateError(out2.logs, 'Build failed');

if (!dev) {
  console.time('minify:css');
  await minifyCSS(out2.outputs);
  console.timeEnd('minify:css');

  console.time('minify:js');
  await minifyJS(out1.outputs, { module: false });
  await minifyJS(out2.outputs);
  console.timeEnd('minify:js');
}
