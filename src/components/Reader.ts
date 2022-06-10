import './Reader.xcss';

import {
  append, createFragment, h, S1Node,
} from 'stage1';
import { extractText } from '../extractor';
import { exec, indexOfORP } from '../utils';
import { ORP } from './ORP';

const wordList = (async () => {
  performance.mark('Extract:start');
  const html = await exec(() => {
    const selection = window.getSelection();
    if (selection?.type === 'Range') {
      const range = selection.getRangeAt(0);
      const contents = range.cloneContents();
      const body = document.createElement('body');
      body.append(contents);
      return body.outerHTML;
    }
    return document.documentElement.outerHTML;
  });
  // eslint-disable-next-line prefer-template
  const text = ' 3. 2. 1. ' + extractText(html) + '\n';
  performance.measure('Extract', 'Extract:start');
  return text.split(' ');
})();

// https://github.com/cameron/squirt/blob/03cf7bf103652857bd54fa7960a39fc27e306b31/squirt.js#L168-L187
const WAIT_AFTER_SHORT_WORD = 1.2;
const WAIT_AFTER_LONG_WORD = 1.5;
const WAIT_AFTER_COMMA = 2;
const WAIT_AFTER_PERIOD = 3;
const WAIT_AFTER_PARAGRAPH = 3.5;

function timeoutMultiplier(word: string, jumped?: boolean) {
  if (jumped) return WAIT_AFTER_PERIOD;
  // if (word === 'Dr.' || word === 'Mr.' || word === 'Mrs.' || word === 'Ms.') return 1;

  let lastChar = word[word.length - 1];
  if (/["”]/.test(lastChar)) lastChar = word[word.length - 2];

  if (lastChar === '\n') return WAIT_AFTER_PARAGRAPH;
  if ('.!?…'.includes(lastChar)) return WAIT_AFTER_PERIOD;
  if (',;:–'.includes(lastChar)) return WAIT_AFTER_COMMA;
  if (word.length < 4) return WAIT_AFTER_SHORT_WORD;
  if (word.length > 11) return WAIT_AFTER_LONG_WORD;
  return 1;
}

interface UserSettings {
  /** Targeted words per minute. */
  wpm?: number;
}

type ReaderComponent = S1Node & HTMLDivElement;

type RefNodes = {
  progress: HTMLDivElement;
  rewind: HTMLButtonElement;
  play: HTMLButtonElement;
  slower: HTMLButtonElement;
  speed: HTMLSpanElement;
  faster: HTMLButtonElement;
  w: HTMLDivElement;
  focus: HTMLDivElement;
};

const view = h(`
  <div>
    <div id=progress>
      <div id=bar #progress></div>
    </div>

    <div id=controls>
      <button class=button #rewind>Rewind</button>
      <button class=button id=play #play>Play</button>
      <button class="button ml-auto" #slower>Slower</button>
      <span class="mh2 bold" #speed>180 wpm</span>
      <button class=button #faster>Faster</button>
    </div>

    <div id=focus #focus></div>
    <div id=word #w></div>
  </div>
`);

export function Reader(): ReaderComponent {
  const root = view as ReaderComponent;
  const {
    progress, rewind, play, slower, speed, faster, w, focus,
  } = view.collect<RefNodes>(root);
  let index = 0;
  let rate = 0; // wpm; words per minute
  let startTime = 0;
  let timer: number | undefined;

  wordList.catch((error) => {
    timer = -1;
    w.innerHTML = `<div id=summary>${String(error)}</div>`;
    w.style.cssText = '';
    // eslint-disable-next-line no-console
    console.error(error);
  });

  function end(words: string[]) {
    const time = (Date.now() - startTime) / 1000;
    const mins = Math.trunc(time / 60);
    stop();

    w.innerHTML = `<div id=summary><em>ﬁn.</em><br>You read ${
      // exclude intro countdown
      words.length - 4
    } words in ${
      time < 60
        ? `${Math.trunc(time)} seconds`
        : `${mins} minute${mins === 1 ? '' : 's'}`
    }.</div>`;

    w.style.cssText = '';
    progress.style.transform = 'translateX(0)';
    focus.className = '';
    play.textContent = 'Play again';
    index = 0;
    startTime = 0;

    (w.firstChild as HTMLDivElement).style.opacity = '0';
    window.setTimeout(() => {
      (w.firstChild as HTMLDivElement).style.opacity = '1';
    });
  }

  async function next(timeout?: number, jumped?: boolean) {
    const words = await wordList;

    if (++index >= words.length) {
      end(words);
      return;
    }

    const word = words[index];
    const orpIndex = indexOfORP(word);
    const frag = createFragment();
    let orp: HTMLElement | undefined;

    // eslint-disable-next-line unicorn/no-array-for-each
    [...word].forEach((char, i) => {
      append(i === orpIndex ? (orp = ORP(char)) : new Text(char), frag);
    });

    frag.normalize();
    w.replaceChildren(frag);

    w.style.transform = `translateX(-${
      orp!.offsetLeft + orp!.offsetWidth / 2
    }px)`;
    progress.style.transform = `translateX(${
      (index / words.length - 1) * 100
    }%)`;

    if (timeout) {
      timer = window.setTimeout(() => {
        void next(timeout);
      }, timeout * timeoutMultiplier(word, jumped));
    }
  }

  function start(jumped?: boolean) {
    if (!startTime) {
      startTime = Date.now();
    }

    void next(60_000 / rate, jumped);
    focus.className = 'show';
    play.textContent = 'Pause';
  }

  function stop() {
    window.clearTimeout(timer);
    timer = undefined;
    play.textContent = 'Play';
  }

  function updateWPM(wpm: number) {
    speed.textContent = `${wpm} wpm`;

    if (timer) {
      stop();
      start();
    }

    void chrome.storage.sync.set({ wpm });
  }

  function togglePlay() {
    if (timer) {
      stop();
    } else {
      start();
    }
  }

  play.__click = togglePlay;

  rewind.__click = async () => {
    const words = await wordList;
    stop();

    // Go back 5 seconds worth of words
    index -= 5000 / (60_000 / rate);

    if (index < 0) {
      index = 0;
    } else {
      // Set index to start of the sentence
      while (index-- && !/[!.?…]$/.test(words[index]));
    }

    start(true);
  };

  slower.__click = () => {
    if (rate > 60) {
      updateWPM((rate -= 60));
      faster.disabled = false;
    } else {
      slower.disabled = true;
    }
  };
  faster.__click = () => {
    if (rate < 1200) {
      updateWPM((rate += 60));
      slower.disabled = false;
    } else {
      faster.disabled = true;
    }
  };

  void chrome.storage.sync.get(null, ({ wpm = 180 }: UserSettings) => {
    rate = wpm;
    speed.textContent = `${wpm} wpm`;

    if (wpm <= 60) {
      slower.disabled = true;
    } else if (wpm >= 1200) {
      faster.disabled = true;
    }

    // Delay auto-play, otherwise it feels like it starts too early
    window.setTimeout(togglePlay, 160);
  });

  return root;
}
