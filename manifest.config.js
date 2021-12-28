/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv3/manifest/
// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/
// https://developer.chrome.com/docs/extensions/mv3/devguide/

const { gitRef } = require('git-ref');
const pkg = require('./package.json');

/** @type {chrome.runtime.Manifest} */
module.exports = {
  manifest_version: 3,
  name: 'Reader',
  description: '🔍 Web page speed reader.',
  version: pkg.version,
  version_name: process.env.GITHUB_REF ? undefined : gitRef().replace(/^v/, ''),
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  action: {
    default_popup: 'reader.html',
  },
  permissions: [
    'activeTab', // https://developer.chrome.com/docs/extensions/mv2/manifest/activeTab/
    'scripting',
    'storage',
  ],
  offline_enabled: true,
  incognito: 'spanning',
  content_security_policy: {
    extension_pages: [
      "default-src 'none'",
      "script-src-elem 'self'",
      "style-src-elem 'self'",
      "font-src 'self'",
      'connect-src https://api.trackx.app',
      'report-uri https://api.trackx.app/v1/9lbe1l9le4x/report',
    ].join(';'),
  },

  // https://chrome.google.com/webstore/detail/reader/ollcdfepbkpopcfilmheonkfbbnnmkbj
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3xP4vEWKRlRR3tFGidLLBGM2PjvisNNH6NSJPEbXSU7PNzogC+GPXW9qN5SEyfVOY7er+SkedCp9RTydfCzGOEaZfsbc11Wt9VV5C+oPhQTx+RBJMUJjJdwn3z1x7t4ufNqNObvNEjwPKLz4OfVbMsy97Q1Rmu/Wt77STonJj0JP7+xCTpFZLNKDslRh/Ceardh6r5S42GnZnlILrQiAVFxBYSh4lmQoAFbYu2D4LS2ZBdAIBA7FqgMpYVVSVSrlffVfM2lGLRcMHzjQ9jS30hVs2othn1LctbwXaRT2VpKchAE2zX8yaOxZ4F72Kf+Y2yC6VcRJ24u4VkVcIgrkvwIDAQAB',
};
