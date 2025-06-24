/**
 * Tracks JavaScript exceptions using the BugBox client.
 *
 * @fileoverview Chrome Extensions v3 disallow remote code execution,
 * so loading BugBox from a CDN isn't an option. Using a local version
 * is both faster and compliant. Since we're targeting modern browsers,
 * the lite client is sufficient.
 */

// TODO: Use bugbox/lite client once available.
import * as bugbox from 'bugbox';

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  bugbox.meta.url = tab.url;
});
