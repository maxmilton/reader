/* eslint-disable @typescript-eslint/restrict-template-expressions */

import "./Reader.xcss";

import { extractText } from "#extractor.ts";
import { exec } from "#utils.ts";
import { collect, h, ONCLICK } from "stage1/fast";
import { compile } from "stage1/macro" with { type: "macro" };
import { FocalPoint, type FocalPointComponent, indexOfORP } from "./FocalPoint.ts";

// eslint-disable-next-line unicorn/prefer-top-level-await
const extractedWords = (async () => {
  performance.mark("Extract:Begin");
  const html = await exec(() => {
    const selection = window.getSelection();
    if (selection?.type === "Range") {
      const range = selection.getRangeAt(0);
      const contents = range.cloneContents();
      const body = document.createElement("body");
      body.append(contents);
      return body.outerHTML;
    }
    return document.documentElement.outerHTML;
  });
  // eslint-disable-next-line prefer-template
  const text = " 3. 2. 1. " + extractText(html) + "\n";
  performance.measure("Extract", "Extract:Begin");
  return text.split(" ");
})();

function waitMultiplier(word: string, forceWait?: boolean) {
  // TODO: Move these constants to outer scope, but only when they are inlined
  // correctly again in production builds.

  // https://github.com/cameron/squirt/blob/03cf7bf103652857bd54fa7960a39fc27e306b31/squirt.js#L168-L187
  const WAIT_AFTER_WORD = 1;
  const WAIT_AFTER_SHORT_WORD = 1.2;
  const WAIT_AFTER_LONG_WORD = 1.5;
  const WAIT_AFTER_COMMA = 2;
  const WAIT_AFTER_PERIOD = 3;
  const WAIT_AFTER_PARAGRAPH = 3.5;

  if (forceWait) return WAIT_AFTER_PERIOD;
  // if (word === 'Dr.' || word === 'Mr.' || word === 'Mrs.' || word === 'Ms.') return 1;

  let lastChar = word[word.length - 1];
  if ('"”'.includes(lastChar)) lastChar = word[word.length - 2];

  if (lastChar === "\n") return WAIT_AFTER_PARAGRAPH;
  if (".!?…".includes(lastChar)) return WAIT_AFTER_PERIOD;
  if (",;:–".includes(lastChar)) return WAIT_AFTER_COMMA;
  if (word.length < 4) return WAIT_AFTER_SHORT_WORD;
  if (word.length > 11) return WAIT_AFTER_LONG_WORD;
  return WAIT_AFTER_WORD;
}

export interface UserSettings {
  /** Target words per minute. */
  wpm?: number;
}

type ReaderComponent = HTMLDivElement;

interface Refs {
  progress: HTMLDivElement;
  rewind: HTMLButtonElement;
  play: HTMLButtonElement;
  slower: HTMLButtonElement;
  speed: Text;
  faster: HTMLButtonElement;
  focus: HTMLDivElement;
  word: HTMLDivElement;
}

const meta = compile<Refs>(`
  <div>
    <div id=progress>
      <div @progress id=bar></div>
    </div>

    <div id=controls>
      <button @rewind>Rewind</button>
      <button @play id=play>Play</button>
      @speed
      <button @slower>−</button>
      <button @faster>+</button>
    </div>

    <div @focus id=focus></div>
    <div @word id=word></div>
  </div>
`);
const view = h<ReaderComponent>(meta.html);

export function Reader(): ReaderComponent {
  const root = view;
  const refs = collect<Refs>(root, meta.d);
  const progress = refs[meta.ref.progress];
  const rewind = refs[meta.ref.rewind];
  const play = refs[meta.ref.play];
  const speed = refs[meta.ref.speed];
  const slower = refs[meta.ref.slower];
  const faster = refs[meta.ref.faster];
  const focus = refs[meta.ref.focus];
  const word = refs[meta.ref.word];

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
    play.textContent = "Play";
  }

  function end() {
    const time = (Date.now() - startTime) / 1000;
    stop();

    // nosemgrep: insecure-document-method
    word.innerHTML = `<div id=summary><em>ﬁn.</em><br>You read ${
      // exclude intro countdown
      words.length - 4} words in ${
      time < 60
        ? `${Math.trunc(time)} seconds`
        : `${Math.trunc(time / 60)} minute${time < 120 ? "" : "s"}`
    }.</div>`;

    word.style.cssText = "";
    progress.style.transform = "translateX(0)";
    focus.className = "";
    play.textContent = "Play again";
    wordsIndex = 0;
    startTime = 0;
  }

  function next(forceWait?: boolean) {
    if (++wordsIndex >= words.length) {
      end();
      return;
    }

    const currentWord = words[wordsIndex];
    const orpIndex = indexOfORP(currentWord);
    let focalPoint: FocalPointComponent;

    word.replaceChildren(
      currentWord.slice(0, orpIndex),
      focalPoint = FocalPoint(currentWord[orpIndex]),
      currentWord.slice(orpIndex + 1),
    );

    word.style.transform = `translateX(-${focalPoint.offsetLeft + focalPoint.offsetWidth / 2}px)`;
    progress.style.transform = `translateX(${(wordsIndex / words.length - 1) * 100}%)`;

    timer = (setTimeout as Window["setTimeout"])(
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      () => next(),
      rate * waitMultiplier(currentWord, forceWait),
    );
  }

  function start(slowStart?: boolean) {
    startTime ||= Date.now();
    focus.className = "show";
    play.textContent = "Pause";
    next(slowStart);
  }

  function updateWPM(newWPM: number) {
    rate = 60_000 / newWPM;
    speed.nodeValue = `${newWPM} wpm`;
    slower.disabled = newWPM <= 60;
    faster.disabled = newWPM >= 1200;

    // Avoid writing to storage on initial load
    if (wpm) {
      void chrome.storage.sync.set({ wpm: newWPM });
    }

    wpm = newWPM;
  }

  rewind[ONCLICK] = () => {
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

  play[ONCLICK] = () => {
    if (timer) {
      stop();
    } else {
      start();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  slower[ONCLICK] = () => updateWPM(wpm - 60);
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  faster[ONCLICK] = () => updateWPM(wpm + 60);

  chrome.storage.sync
    .get<UserSettings>()
    .then((settings) => {
      updateWPM(settings.wpm ?? 180);
      return extractedWords;
    })
    .then((wordList) => {
      performance.measure("Preprocessing");
      words = wordList;
      start(true);
    })
    .catch((error: unknown) => {
      // nosemgrep: insecure-document-method
      word.innerHTML = `<div id=summary>${String(error)}</div>`;
      rewind.disabled = true;
      play.disabled = true;
      // eslint-disable-next-line no-console
      console.error(error);
    });

  return root;
}
