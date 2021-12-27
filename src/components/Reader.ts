import {
  append, createFragment, h, S1Node,
} from 'stage1';
import { extractText } from '../extractor';
import { exec, indexOfORP } from '../utils';
import { ORP } from './ORP';
import './Reader.xcss';

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
  const text = ' 3. 2. 1. ' + extractText(html);
  performance.measure('Extract', 'Extract:start');
  return text.split(' ');
})();

// wordList.then(console.log);

interface UserSettings {
  /** Words Per Minute. */
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
    <div id=progress #progress></div>

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
  const root = view.cloneNode(true) as ReaderComponent;
  const {
    progress, rewind, play, slower, speed, faster, w, focus,
  } = view.collect<RefNodes>(root);
  let index = 0;
  let rate = 0; // wpm; words per minute
  let startTime = 0;
  let timer: number | undefined;

  wordList.catch((error) => {
    timer = -1;
    w.innerHTML = `<div class="summary tc">${String(error)}</div>`;
    w.style.transform = 'translateX(-50%)';
    (w.firstChild as HTMLDivElement).style.opacity = '1';
    // eslint-disable-next-line no-console
    console.error(error);
  });

  async function next(timeout?: number) {
    const words = await wordList;

    if (++index >= words.length) {
      const time = (Date.now() - startTime) / 1000;
      const mins = Math.trunc(time / 60);
      stop();

      w.innerHTML = `<div class="summary tc"><em>ﬁn.</em><br>You read ${
        // exclude intro and final space
        words.length - 5
      } words in ${
        time < 60
          ? `${Math.trunc(time)} seconds`
          : `${mins} minute${mins === 1 ? '' : 's'}`
      }.</div>`;

      w.style.transform = 'translateX(-50%)';
      progress.style.transform = 'translateX(0)';
      focus.className = '';
      play.textContent = 'Play again';
      index = 0;
      startTime = 0;

      window.setTimeout(() => {
        (w.firstChild as HTMLDivElement).style.opacity = '1';
      });

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

    if (orp) {
      w.style.transform = `translateX(-${
        orp.offsetLeft + orp.offsetWidth / 2
      }px)`;
    }
    progress.style.transform = `translateX(${
      (index / words.length - 1) * 100
    }%)`;

    if (timeout) {
      let delay = 0;

      // Adjust delay under certain conditions
      if (word === '') {
        delay = timeout * 0.8;
      } else if (/[!.?…‽⁈]$/.test(word)) {
        delay = timeout * 1.15;
      } else if (word.length > 10 || /(^["'(—‘“])|(["'),:;—’”]$)/.test(word)) {
        delay = timeout / 2;
      }

      timer = window.setTimeout(() => {
        void next(timeout);
      }, timeout + delay);
    }
  }

  function start() {
    if (!startTime) {
      startTime = Date.now();
    }

    void next(60_000 / rate);
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

  play.__click = () => {
    if (timer) {
      stop();
    } else {
      start();
    }
  };

  rewind.__click = async () => {
    const wasPlaying = !!timer;
    const words = await wordList;
    stop();

    // Go back 5 seconds worth of words
    index -= 5000 / (60_000 / rate);

    if (index < 0) {
      index = 0;
    } else {
      // Set index to start of the sentence
      while (index-- && !/[!.?…‽⁈]$/.test(words[index]));
    }

    await next();

    if (wasPlaying) {
      start();
    }
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

    // Delay start, otherwise it feels like play begins too early
    // eslint-disable-next-line @typescript-eslint/unbound-method
    window.setTimeout(play.__click, 160);
  });

  return root;
}
