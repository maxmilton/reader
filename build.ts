/* eslint-disable no-await-in-loop, no-console */

import { basename } from 'node:path'; // eslint-disable-line unicorn/import-style
import * as swc from '@swc/core';
import * as csso from 'csso';
import * as xcss from 'ekscss';
import * as lightningcss from 'lightningcss';
import { PurgeCSS, type RawContent } from 'purgecss';
import { createManifest } from './manifest.config.ts';
import xcssConfig from './xcss.config.ts';

const env = Bun.env.NODE_ENV;
const dev = env === 'development';

function xcssPlugin(config: xcss.XCSSCompileOptions): Bun.BunPlugin {
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
        if (compiled.warnings.length > 0) console.error(compiled.warnings);
        return { contents: compiled.css, loader: 'css' };
      });
    },
  };
}

function makeHTML(release: string) {
  // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
  const bugboxApiKey = 'AZczqkPBcACag7DE9p762A';
  return `
    <!doctype html>
    <meta charset=utf-8>
    <meta name=google value=notranslate>
    <link href=literata.ttf rel=preload as=font type=font/ttf crossorigin>
    <link href=reader.css rel=stylesheet>
    <script src=health.js defer crossorigin data-key=${bugboxApiKey} data-release=${release}${env === 'production' ? '' : ` data-env=${String(env)}`}></script>
    <script src=reader.js defer></script>
  `
    .trim()
    .replaceAll(/\n\s+/g, '\n'); // remove leading whitespace
}

async function minifyCSS(artifacts: Bun.BuildArtifact[]) {
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
        css: [{ raw: source }],
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
        // eslint-disable-next-line no-bitwise
        targets: { chrome: 134 << 16 }, // matches manifest minimum_chrome_version
      });
      if (minified.warnings.length > 0) console.error(minified.warnings);

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
  artifacts: Bun.BuildArtifact[],
  options?: Omit<swc.JsMinifyOptions, 'sourceMap'>,
): Promise<void> {
  for (const artifact of artifacts) {
    if (artifact.kind === 'entry-point' || artifact.kind === 'chunk') {
      const source = await artifact.text();
      const result = await swc.minify(source, {
        ecma: 2020,
        module: true,
        compress: {
          comparisons: false,
          negate_iife: false,
          reduce_funcs: false, // prevent single-use function inlining
          hoist_funs: true,
          passes: 3,
          // XXX: Comment out to keep performance markers for debugging.
          pure_funcs: ['performance.mark', 'performance.measure'],
        },
        format: {
          wrap_func_args: true,
          wrap_iife: true,
          semicolons: false, // better debugging with near-zero overhead
        },
        mangle: {
          props: {
            regex: String.raw`^\$\$`,
          },
        },
        ...options,
      });
      await Bun.write(artifact.path, result.code);
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
await Bun.write('dist/reader.html', makeHTML(release));
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
    'process.env.NODE_ENV': JSON.stringify(env),
  },
  minify: !dev,
  sourcemap: dev ? 'linked' : 'none',
  banner: '"use strict";',
});
console.timeEnd('build:1');

// Reader app JS
console.time('build:2');
const out2 = await Bun.build({
  entrypoints: ['src/reader.ts'],
  outdir: 'dist',
  target: 'browser',
  external: ["*.ttf"],
  define: {
    'process.env.APP_RELEASE': JSON.stringify(release),
    'process.env.NODE_ENV': JSON.stringify(env),
  },
  loader: {
    '.svg': 'text',
  },
  plugins: [xcssPlugin(xcssConfig)],
  emitDCEAnnotations: true,
  minify: !dev,
  sourcemap: dev ? 'linked' : 'none',
});
console.timeEnd('build:2');

if (!dev) {
  console.time('minify:css');
  await minifyCSS(out2.outputs);
  console.timeEnd('minify:css');

  console.time('minify:js');
  await minifyJS(out1.outputs, { module: false });
  await minifyJS(out2.outputs);
  console.timeEnd('minify:js');
}

console.debug(out1.outputs, out2.outputs);
