import { gitRef } from 'git-ref';
import pkg from './package.json' assert { type: 'json' };

export const makeManifest = (): chrome.runtime.ManifestV3 => ({
  manifest_version: 3,
  name: 'Reader',
  description: pkg.description,
  version: pkg.version,
  version_name: process.env.CI ? undefined : gitRef().replace(/^v/, ''),
  homepage_url: pkg.homepage,
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  action: {
    default_popup: 'reader.html',
  },
  permissions: [
    'activeTab', // https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/
    'scripting', // https://developer.chrome.com/docs/extensions/reference/scripting/
    'storage', // https://developer.chrome.com/docs/extensions/reference/storage/
  ],
  offline_enabled: true,
  incognito: 'spanning',
  content_security_policy: {
    extension_pages: [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "font-src 'self'",
      "img-src 'none'",
      "base-uri 'none'",
      'connect-src https://api.trackx.app',
      'report-uri https://api.trackx.app/v1/9lbe1l9le4x/report',
      '',
    ].join(';'),
  },

  // https://chrome.google.com/webstore/detail/reader/ollcdfepbkpopcfilmheonkfbbnnmkbj
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3xP4vEWKRlRR3tFGidLLBGM2PjvisNNH6NSJPEbXSU7PNzogC+GPXW9qN5SEyfVOY7er+SkedCp9RTydfCzGOEaZfsbc11Wt9VV5C+oPhQTx+RBJMUJjJdwn3z1x7t4ufNqNObvNEjwPKLz4OfVbMsy97Q1Rmu/Wt77STonJj0JP7+xCTpFZLNKDslRh/Ceardh6r5S42GnZnlILrQiAVFxBYSh4lmQoAFbYu2D4LS2ZBdAIBA7FqgMpYVVSVSrlffVfM2lGLRcMHzjQ9jS30hVs2othn1LctbwXaRT2VpKchAE2zX8yaOxZ4F72Kf+Y2yC6VcRJ24u4VkVcIgrkvwIDAQAB',
});
