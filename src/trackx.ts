/**
 * Track JS exceptions with the trackx client.
 *
 * @fileoverview In Chrome extensions v3 running remote code is not allowed so
 * trackx via CDN would not work + loading local code is obviously much faster.
 *
 * Since the runtime environment will be modern browsers the lite client is OK.
 */

import * as trackx from 'trackx/lite';

trackx.setup('https://api.trackx.app/v1/9lbe1l9le4x');
trackx.meta.release = process.env.APP_RELEASE;

if (process.env.NODE_ENV !== 'production') {
  trackx.meta.NODE_ENV = process.env.NODE_ENV;
}

void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  trackx.meta.url = tab.url;
});

void fetch('https://api.trackx.app/v1/9lbe1l9le4x/ping', {
  method: 'POST',
  keepalive: true,
  mode: 'no-cors',
});
