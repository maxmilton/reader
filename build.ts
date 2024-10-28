/* eslint-disable no-bitwise, no-console */

import type { BuildArtifact, BunPlugin } from 'bun';
import * as csso from 'csso';
import * as xcss from 'ekscss';
import * as lightningcss from 'lightningcss';
import { PurgeCSS } from 'purgecss';
import * as terser from 'terser';
import { createManifest } from './manifest.config';
import xcssConfig from './xcss.config';

const mode = Bun.env.NODE_ENV;
const dev = mode === 'development';

let css = '';
// XXX: Temporary workaround to build CSS until Bun.build supports css loader
const extractCSS: BunPlugin = {
  name: 'extract-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      css += await Bun.file(args.path).text();
      return { contents: '', loader: 'js' };
    });
    build.onLoad({ filter: /\.xcss$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      const compiled = xcss.compile(source, {
        from: args.path,
        globals: xcssConfig.globals,
        plugins: xcssConfig.plugins,
      });

      for (const warning of compiled.warnings) {
        console.error('XCSS:', warning.message);

        if (warning.file) {
          console.log(
            `  at ${[warning.file, warning.line, warning.column]
              .filter(Boolean)
              .join(':')}`,
          );
        }
      }

      css += compiled.css;
      return { contents: '', loader: 'js' };
    });
  },
};

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

async function minifyCSS(artifact: BuildArtifact) {
  const js = await artifact.text();
  const purged = await new PurgeCSS().purge({
    content: [{ extension: '.js', raw: js }],
    css: [{ raw: css }],
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
  // TODO: Migrate to bun CSS handling (which is based on lightningcss).
  const minified = lightningcss.transform({
    filename: 'popup.css',
    code: new TextEncoder().encode(purged[0].css),
    minify: true,
    targets: { chrome: 88 << 16 }, // matches manifest minimum_chrome_version
  });

  for (const warning of minified.warnings) {
    console.error('CSS:', warning.message);
  }

  const minified2 = csso.minify(minified.code.toString(), {
    filename: 'popup.css',
    // forceMediaMerge: true, // somewhat unsafe
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

  await Bun.write('dist/reader.css', minified2.css);
}

async function minifyJS(artifact: BuildArtifact) {
  let source = await artifact.text();

  // Improve collapsing variables; terser doesn't do this so we do it manually.
  source = source.replaceAll('const ', 'let ');

  const result = await terser.minify(source, {
    ecma: 2020,
    module: true,
    compress: {
      reduce_funcs: false, // prevent functions being inlined
      hoist_funs: true,
      // XXX: Comment out to keep performance markers for debugging.
      pure_funcs: ['performance.mark', 'performance.measure'],
      passes: 3,
    },
    mangle: {
      properties: {
        regex: /^\$\$/,
      },
    },
  });

  await Bun.write(artifact.path, result.code!);
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

// Reader app JS
console.time('build');
const out = await Bun.build({
  entrypoints: ['src/reader.ts'],
  outdir: 'dist',
  target: 'browser',
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  loader: {
    '.svg': 'text',
  },
  external: ['literata-ext.woff2', 'literata-italic.woff2', 'literata.woff2'],
  plugins: [extractCSS],
  // minify: !dev,
  minify: {
    whitespace: !dev,
    identifiers: !dev,
    // FIXME: Bun macros break if syntax minify is disabled (due to string
    // interpolation and concatenation not being resolved).
    syntax: true,
  },
  sourcemap: dev ? 'external' : 'none',
});
console.timeEnd('build');
console.log(out);

// Health insights (exception monitoring)
console.time('build2');
const out2 = await Bun.build({
  entrypoints: ['src/health.ts'],
  outdir: 'dist',
  target: 'browser',
  // FIXME: Consider using iife once bun supports it.
  // format: 'iife', // monitoring code must not mutate global state
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  minify: !dev,
  sourcemap: dev ? 'external' : 'none',
});
console.timeEnd('build2');
console.log(out2);

if (dev) {
  await Bun.write('dist/reader.css', css);
} else {
  console.time('minify:css');
  await minifyCSS(out.outputs[0]);
  console.timeEnd('minify:css');

  console.time('minify:js');
  await minifyJS(out.outputs[0]);
  await minifyJS(out2.outputs[0]);
  console.timeEnd('minify:js');
}
