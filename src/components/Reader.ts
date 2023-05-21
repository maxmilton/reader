import './Reader.xcss';

import { h, type S1Node } from 'stage1';
import { extractText } from '../extractor';
import { exec } from '../utils';
import { indexOfORP, ORP } from './ORP';

// eslint-disable-next-line unicorn/prefer-top-level-await
const extractedWords = (async () => {
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

function waitMultiplier(word: string, forceWait?: boolean) {
  if (forceWait) return WAIT_AFTER_PERIOD;
  // if (word === 'Dr.' || word === 'Mr.' || word === 'Mrs.' || word === 'Ms.') return 1;

  // eslint-disable-next-line unicorn/prefer-at
  let lastChar = word[word.length - 1];
  // eslint-disable-next-line unicorn/prefer-at
  if (/["”]/.test(lastChar)) lastChar = word[word.length - 2];

  if (lastChar === '\n') return WAIT_AFTER_PARAGRAPH;
  if ('.!?…'.includes(lastChar)) return WAIT_AFTER_PERIOD;
  if (',;:–'.includes(lastChar)) return WAIT_AFTER_COMMA;
  if (word.length < 4) return WAIT_AFTER_SHORT_WORD;
  if (word.length > 11) return WAIT_AFTER_LONG_WORD;
  return 1;
}

interface UserSettings {
  /** Target words per minute. */
  wpm?: number;
}

type ReaderComponent = S1Node & HTMLDivElement;

type Refs = {
  progress: HTMLDivElement;
  rewind: HTMLButtonElement;
  play: HTMLButtonElement;
  slower: HTMLButtonElement;
  speed: Text;
  faster: HTMLButtonElement;
  focus: HTMLDivElement;
  w: HTMLDivElement;
};

const view = h(`
  <div>
    <div id=progress>
      <div id=bar #progress></div>
    </div>

    <div id=controls>
      <button #rewind>Rewind</button>
      <button id=play #play>Play</button>
      #speed
      <button #slower>−</button>
      <button #faster>+</button>
    </div>

    <div id=focus #focus></div>
    <div id=word #w></div>
  </div>
`);

export function Reader(): ReaderComponent {
  const root = view as ReaderComponent;
  const refs = view.collect<Refs>(root);
  const wordref = refs.w;
  let words: string[] = [];
  let wordsIndex = 0;
  /** Current target words per minute. */
  let wpm = 0;
  /** Current timing base rate; ms per word. */
  let rate = 0;
  let startTime = 0;
  let timer: number | undefined;

  function stop() {
    clearTimeout(timer);
    timer = undefined;
    refs.play.textContent = 'Play';
  }

  function end() {
    const time = (Date.now() - startTime) / 1000;
    stop();

    wordref.innerHTML = `<div id=summary><em>ﬁn.</em><br>You read ${
      // exclude intro countdown
      words.length - 4
    } words in ${
      time < 60
        ? `${Math.trunc(time)} seconds`
        : `${Math.trunc(time / 60)} minute${time < 120 ? '' : 's'}`
    }.</div>`;

    wordref.style.cssText = '';
    refs.progress.style.transform = 'translateX(0)';
    refs.focus.className = '';
    refs.play.textContent = 'Play again';
    wordsIndex = 0;
    startTime = 0;
  }

  function next(forceWait?: boolean) {
    if (++wordsIndex >= words.length) {
      end();
      return;
    }

    const word = words[wordsIndex];
    const orpIndex = indexOfORP(word);
    let orp;

    wordref.replaceChildren(
      word.slice(0, orpIndex),
      (orp = ORP(word[orpIndex])),
      word.slice(orpIndex + 1),
    );

    wordref.style.transform = `translateX(-${
      orp.offsetLeft + orp.offsetWidth / 2
    }px)`;
    refs.progress.style.transform = `translateX(${
      (wordsIndex / words.length - 1) * 100
    }%)`;

    timer = (setTimeout as Window['setTimeout'])(
      () => next(),
      rate * waitMultiplier(word, forceWait),
    );
  }

  function start(slowStart?: boolean) {
    if (!startTime) {
      startTime = Date.now();
    }

    next(slowStart);
    refs.focus.className = 'show';
    refs.play.textContent = 'Pause';
  }

  function updateWPM(newWPM: number) {
    rate = 60_000 / newWPM;
    // refs.speed.textContent = `${newWPM} wpm`;
    refs.speed.nodeValue = `${newWPM} wpm`;
    refs.slower.disabled = newWPM <= 60;
    refs.faster.disabled = newWPM >= 1200;

    // Avoid writing to storage on initial load
    if (wpm) {
      void chrome.storage.sync.set({ wpm: newWPM });
    }

    wpm = newWPM;
  }

  refs.rewind.__click = () => {
    stop();

    // Go back 3 seconds worth of words
    wordsIndex -= 3000 / rate;

    if (wordsIndex <= 0) {
      wordsIndex = 0;
    } else {
      // Set index to start of the sentence
      while (wordsIndex-- && !/[!.?…]$/.test(words[wordsIndex]));
    }

    start(true);
  };

  refs.play.__click = () => {
    if (timer) {
      stop();
    } else {
      start();
    }
  };

  refs.slower.__click = () => updateWPM(wpm - 60);
  refs.faster.__click = () => updateWPM(wpm + 60);

  chrome.storage.sync
    .get()
    .then((settings: UserSettings) => {
      updateWPM(settings.wpm || 180);
      return extractedWords;
    })
    .then((wordList) => {
      words = wordList;
      start(true);
    })
    .catch((error) => {
      wordref.innerHTML = `<div id=summary>${String(error)}</div>`;
      refs.rewind.disabled = true;
      refs.play.disabled = true;
      // eslint-disable-next-line no-console
      console.error(error);
    });

  return root;
}
