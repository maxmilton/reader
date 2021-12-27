/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */

// https://developer.chrome.com/docs/extensions/mv3/manifest/
// https://developer.chrome.com/docs/extensions/mv2/manifest/
// https://developer.chrome.com/docs/extensions/reference/
// https://developer.chrome.com/docs/extensions/mv3/devguide/

const { gitRef } = require('git-ref');
const pkg = require('./package.json');

/** @type {chrome.runtime.Manifest} */
const manifest = {
  manifest_version: 3,
  name: 'Reader',
  description: 'Experimental web page speed reader.',
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
    extension_pages:
      "default-src 'none';"
      + "script-src 'self';"
      + "style-src 'self';"
      + "font-src 'self';"
      + 'connect-src https://api.trackx.app;'
      + 'report-uri https://api.trackx.app/v1/9lbe1l9le4x/report;',
  },

  // FIXME: Update to real webstore ID and key once it's published
  // https://chrome.google.com/webstore/detail/reader/obfgebngemlbebjdbnccgapomejkfckj
  // key: '',
};

module.exports = manifest;
