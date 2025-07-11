import pkg from "./package.json" with { type: "json" };

function gitRef() {
  return Bun.spawnSync(["git", "describe", "--always", "--dirty=-dev", "--broken"])
    .stdout.toString()
    .trim()
    .replace(/^v/, "");
}

// TODO: Remove these once `@types/chrome` includes these types.
/** @see https://developer.chrome.com/docs/extensions/mv3/cross-origin-isolation/ */
interface ManifestExtra {
  /** @see https://developer.chrome.com/docs/extensions/mv3/manifest/cross_origin_embedder_policy/ */
  cross_origin_embedder_policy?: {
    value: string;
  };
  /** @see https://developer.chrome.com/docs/extensions/mv3/manifest/cross_origin_opener_policy/ */
  cross_origin_opener_policy?: {
    value: string;
  };
}

/**
 * Generates a browser extension manifest.
 * @param debug - Whether to include a version name for debugging.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/
 * @see https://developer.chrome.com/docs/extensions/mv3/manifest/
 *
 * @internal
 */
export function createManifest(
  debug = !process.env.CI,
): chrome.runtime.ManifestV3 & ManifestExtra {
  return {
    manifest_version: 3,
    name: "Reader",
    description: pkg.description,
    homepage_url: pkg.homepage,
    version: pkg.version.split("-")[0],
    // shippable releases should not have a named version
    version_name: debug ? gitRef() : undefined,
    minimum_chrome_version: "134", // matches build
    icons: {
      16: "icon16.png",
      48: "icon48.png",
      128: "icon128.png",
    },
    permissions: [
      "activeTab", // https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/
      "scripting", // https://developer.chrome.com/docs/extensions/reference/scripting/
      "storage", // https://developer.chrome.com/docs/extensions/reference/storage/
    ],
    action: {
      default_popup: "reader.html",
    },
    offline_enabled: true,
    content_security_policy: {
      extension_pages: [
        "default-src 'none'",
        "base-uri 'none'",
        "script-src 'self'",
        "style-src 'self'",
        "font-src 'self'",
        "img-src 'none'",
        "connect-src https://io.bugbox.app",
        "report-uri https://io.bugbox.app/v0/AZczqkPBcACag7DE9p762A/report",
        "", // include trailing semicolon
      ].join(";"),
    },
    // https://developer.chrome.com/docs/extensions/mv3/cross-origin-isolation/
    cross_origin_embedder_policy: { value: "require-corp" },
    cross_origin_opener_policy: { value: "same-origin" },

    // https://chrome.google.com/webstore/detail/reader/ollcdfepbkpopcfilmheonkfbbnnmkbj
    key:
      "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3xP4vEWKRlRR3tFGidLLBGM2PjvisNNH6NSJPEbXSU7PNzogC+GPXW9qN5SEyfVOY7er+SkedCp9RTydfCzGOEaZfsbc11Wt9VV5C+oPhQTx+RBJMUJjJdwn3z1x7t4ufNqNObvNEjwPKLz4OfVbMsy97Q1Rmu/Wt77STonJj0JP7+xCTpFZLNKDslRh/Ceardh6r5S42GnZnlILrQiAVFxBYSh4lmQoAFbYu2D4LS2ZBdAIBA7FqgMpYVVSVSrlffVfM2lGLRcMHzjQ9jS30hVs2othn1LctbwXaRT2VpKchAE2zX8yaOxZ4F72Kf+Y2yC6VcRJ24u4VkVcIgrkvwIDAQAB",
  };
}
