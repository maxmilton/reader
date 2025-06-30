/**
 * Tracks JavaScript exceptions using the BugBox client.
 *
 * @fileoverview Chrome extensions v3 disallows remote code execution, so
 * loading BugBox from a CDN isn't an option. Using a local version is both
 * faster and compliant. Since we're targeting modern browsers, the micro
 * client is sufficient.
 */

import { meta } from "bugbox/micro";

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  meta.url = tab.url;
});
