/* eslint-disable no-await-in-loop, no-console */

import { basename } from "node:path"; // eslint-disable-line unicorn/import-style
import { xcss } from "bun-plugin-ekscss";
import * as csso from "csso";
import * as lightningcss from "lightningcss";
import { PurgeCSS, type RawContent } from "purgecss";
import * as terser from "terser";
import { createManifest } from "./manifest.config.ts";
import xcssConfig from "./xcss.config.js";

const env = Bun.env.NODE_ENV;
const dev = env === "development";

function makeHTML(release: string) {
  // nosemgrep: generic-api-key
  const bugboxApiKey = "AZczqkPBcACag7DE9p762A";
  return `
    <!doctype html>
    <meta charset=utf-8>
    <meta name=google value=notranslate>
    <link href=literata.ttf rel=preload as=font type=font/ttf crossorigin>
    <link href=reader.css rel=stylesheet>
    <script src=health.js crossorigin data-key=${bugboxApiKey} data-release=${release}${
    env === "production" ? "" : ` data-env=${String(env)}`
  }></script>
    <script src=reader.js defer></script>
  `
    .trim()
    .replaceAll(/\n\s+/g, "\n"); // remove leading whitespace
}

async function minifyCSS(artifacts: Bun.BuildArtifact[]) {
  const content: RawContent[] = [];
  const purgecss = new PurgeCSS();
  const encoder = new TextEncoder();

  for (const artifact of artifacts) {
    if (artifact.path.endsWith(".js") || artifact.path.endsWith(".mjs")) {
      content.push({ extension: ".js", raw: await artifact.text() });
    }
  }

  for (const artifact of artifacts) {
    if (artifact.path.endsWith(".css")) {
      const filename = basename(artifact.path);
      const source = await artifact.text();
      const purged = await purgecss.purge({
        content,
        css: [{ raw: source }],
        safelist: ["html", "body"],
        blocklist: [
          // XXX: Remember to remove if actually using the element tag
          "article",
          "aside",
          "blockquote",
          "break",
          "canvas",
          "dd",
          // "disabled",
          "dt",
          "embed",
          "figcaption",
          "figure",
          // "footer",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "header",
          "hgroup",
          "hr",
          "iframe",
          "img",
          "input",
          "link",
          "main",
          "nav",
          "ol",
          "pre",
          "section",
          "select",
          "source",
          "svg",
          "table",
          "textarea",
          "ul",
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
              "button", // #apply mapped to "button"
              "disabled", // not actually used (as class)
            ],
          },
        },
        // debug: true,
      });

      await Bun.write(artifact.path, minified2.css);
    }
  }
}

async function minifyJS(artifacts: Bun.BuildArtifact[]): Promise<void> {
  for (const artifact of artifacts) {
    if (artifact.path.endsWith(".js") || artifact.path.endsWith(".mjs")) {
      const source = await artifact.text();
      const result = await terser.minify(source, {
        ecma: 2020,
        compress: {
          reduce_funcs: false, // prevent single-use function inlining
          hoist_funs: true,
          passes: 2,
          // NOTE: Comment out to keep performance markers for debugging.
          pure_funcs: ["performance.mark", "performance.measure"],
        },
        format: {
          semicolons: false, // better debugging with near-zero overhead
        },
      });
      await Bun.write(artifact.path, result.code!);
    }
  }
}

console.time("prebuild");
await Bun.$`rm -rf dist`;
await Bun.$`cp -r static dist`;
console.timeEnd("prebuild");

// Extension manifest
console.time("manifest");
const manifest = createManifest();
const release = manifest.version_name ?? manifest.version;
await Bun.write("dist/manifest.json", JSON.stringify(manifest));
console.timeEnd("manifest");

// Reader app HTML
console.time("html");
await Bun.write("dist/reader.html", makeHTML(release));
console.timeEnd("html");

// Health insights (exception monitoring)
console.time("build:health");
const out1 = await Bun.build({
  entrypoints: ["src/health.ts"],
  outdir: "dist",
  target: "browser",
  define: {
    "process.env.APP_RELEASE": JSON.stringify(release),
    "process.env.NODE_ENV": JSON.stringify(env),
  },
  banner: '"use strict";',
  minify: !dev,
  sourcemap: dev ? "linked" : "none",
});
console.timeEnd("build:health");

// Reader app JS
console.time("build:reader");
const out2 = await Bun.build({
  entrypoints: ["src/reader.ts"],
  outdir: "dist",
  target: "browser",
  external: ["*.ttf"],
  define: {
    "process.env.APP_RELEASE": JSON.stringify(release),
    "process.env.NODE_ENV": JSON.stringify(env),
  },
  plugins: [xcss(xcssConfig)],
  banner: '"use strict";',
  emitDCEAnnotations: true,
  minify: !dev,
  sourcemap: dev ? "linked" : "none",
});
console.timeEnd("build:reader");

if (!dev) {
  console.time("minify:css");
  await minifyCSS(out2.outputs);
  console.timeEnd("minify:css");

  console.time("minify:js");
  await minifyJS(out1.outputs);
  await minifyJS(out2.outputs);
  console.timeEnd("minify:js");
}
