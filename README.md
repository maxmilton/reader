[![Build status](https://img.shields.io/github/workflow/status/maxmilton/reader/ci)](https://github.com/maxmilton/reader/actions)
[![Coverage status](https://img.shields.io/codeclimate/coverage/maxmilton/reader)](https://codeclimate.com/github/maxmilton/reader)
[![Chrome Web Store version](https://img.shields.io/chrome-web-store/v/obfgebngemlbebjdbnccgapomejkfckj.svg)](https://chrome.google.com/webstore/detail/reader/obfgebngemlbebjdbnccgapomejkfckj)
[![Licence](https://img.shields.io/github/license/maxmilton/reader.svg)](https://github.com/maxmilton/reader/blob/master/LICENSE)

# Reader

Experimental web page speed reader.

<!-- FIXME: Update to real webstore ID once it's published -->

[![Add to Chrome](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/mPGKYBIR2uCP0ApchDXE.png)](https://chrome.google.com/webstore/detail/reader/obfgebngemlbebjdbnccgapomejkfckj)

### Features

- Extracts the most meaningful text on any page or your selection.
- Shows one word at a time with the optimal recognition point (ORP) highlighted.
- Simple, distraction-free, no-nonsense user interface.
- Far smaller and faster than similar extensions.
- Still works when JavaScript is disabled on the page or you're offline.
- Tight security and does not modify the page at all.

### Technology

- [ekscss](https://github.com/maxmilton/ekscss) style preprocessor
- [stage1](https://github.com/maxmilton/stage1) JavaScript framework
- [esbuild](https://esbuild.github.io/) JavaScript bundler

## Browser support

Recent versions of Google Chrome and other Chromium based browsers (e.g., Brave, Edge).

## Bugs

Please report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/reader/issues).

### Known issues

1. Text on some pages may include unwanted things like ad text. This extension does its best to extract only the most meaningful content in a site-agnostic way using generic heuristics. HTML markup varies wildly from site-to-site and so the extension can't handle every scenario. It's also not a goal to do site-specific content filtering.

   I highly recommended you try the [Brave browser](https://brave.com). Brave has excellent ad blocking capabilities and its [Speedreader](https://support.brave.com/hc/en-us/articles/360045031392-What-is-SpeedReader-) feature cleans up page content for you! Load a page in Speedreader mode before running this extension for the best results.

   An alternative is to manually select content on the page and then start the extension. It will automatically get your selection and extract the text from that.

## License

MIT license. See [LICENSE](https://github.com/maxmilton/reader/blob/master/LICENSE).

The [magnifying glass icon](https://github.com/twitter/twemoji/blob/master/assets/svg/1f50d.svg) is from [twitter/twemoji](https://github.com/twitter/twemoji) which is licensed CC-BY 4.0.

---

© 2021 [Max Milton](https://maxmilton.com)
