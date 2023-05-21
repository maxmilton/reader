[![Build status](https://img.shields.io/github/actions/workflow/status/maxmilton/reader/ci.yml?branch=master)](https://github.com/maxmilton/reader/actions)
[![Coverage status](https://img.shields.io/codeclimate/coverage/maxmilton/reader)](https://codeclimate.com/github/maxmilton/reader)
[![Chrome Web Store version](https://img.shields.io/chrome-web-store/v/ollcdfepbkpopcfilmheonkfbbnnmkbj.svg)](https://chrome.google.com/webstore/detail/reader/ollcdfepbkpopcfilmheonkfbbnnmkbj)
[![Licence](https://img.shields.io/github/license/maxmilton/reader.svg)](https://github.com/maxmilton/reader/blob/master/LICENSE)

# Reader ![](./static/icon48.png)

Web page speed reader browser extension. Uses [rapid serial visual presentation (RSVP)](https://en.wikipedia.org/wiki/Rapid_serial_visual_presentation), optimal recognition point (ORP), and other techniques to increase reading speed and retention.

The recommended use is for content that takes under 5 minutes to speed read or articles you would otherwise skim over. Extended focus can lead to fatigue and diminished results. To read longer text, use the pause button to take a break when you feel fatigue creeping in.

[![Add to Chrome](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/mPGKYBIR2uCP0ApchDXE.png)](https://chrome.google.com/webstore/detail/reader/ollcdfepbkpopcfilmheonkfbbnnmkbj)

### Features

- Extracts the most meaningful text on any page or from your selection.
- Shows one word at a time in quick succession with a highlighted focus point.
- Simple, distraction-free, no-nonsense user interface.
- Still works when JavaScript is disabled or you're offline.
- Far smaller, faster, and less intrusive than similar tools.
- No user tracking, tight security, and no unexpected nastiness.

### Technology

- [@maxmilton/html-parser](https://github.com/maxmilton/html-parser) HTML parser (fork of [html5parser](https://github.com/acrazing/html5parser))
- [ekscss](https://github.com/maxmilton/ekscss) style preprocessor
- [stage1](https://github.com/maxmilton/stage1) JavaScript framework
- [esbuild](https://github.com/evanw/esbuild) JavaScript bundler
- [bun](https://github.com/oven-sh/bun) JavaScript bundler and runtime

## Browser support

Recent versions of Google Chrome and other Chromium-based browsers (e.g., Brave, Edge).

## Bugs

Report any bugs you encounter on the [GitHub issue tracker](https://github.com/maxmilton/reader/issues).

### Known issues

1. Extracted text on some pages may include unwanted things like ad text. This extension does its best to find only the most meaningful content in a website-agnostic way using generic heuristics. HTML markup varies wildly from website to website, so the extension can't handle _every_ scenario. It's also not a goal to do website-specific content filtering.

   There are two solutions:

   1. Manually select content on the page and then start the extension. It will automatically get your selection and extract the text from that.

   1. Try the [Brave browser](https://brave.com). Brave has excellent ad-blocking capabilities, and its [Speedreader](https://support.brave.com/hc/en-us/articles/360045031392-What-is-SpeedReader-) feature cleans up page content for you! Load a page in Speedreader mode before running this extension. This is the recommended method for best results.

## Prior art

- [Spritz](https://spritz.com)
- <https://github.com/cameron/squirt>
- <https://github.com/topics/speed-reading>
- <https://github.com/search?q=spritz+read>
- <https://chrome.google.com/webstore/search/speed%20read>

## License

MIT license. See [LICENSE](https://github.com/maxmilton/reader/blob/master/LICENSE).

The [Literata web font](https://fonts.google.com/specimen/Literata) is from [googlefonts/literata](https://github.com/googlefonts/literata) which is licensed OFL-1.1.

The [open book icon](https://github.com/twitter/twemoji/blob/master/assets/svg/1f4d6.svg) is from [twitter/twemoji](https://github.com/twitter/twemoji) which is licensed CC-BY 4.0.

---

© 2023 [Max Milton](https://maxmilton.com)
