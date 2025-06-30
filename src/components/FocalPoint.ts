import "./FocalPoint.xcss";

import { create } from "stage1/fast";

const NON_WORD_RE = /\W/;

/**
 * Get the Optimal Recognition Point (OPR) index for a given word phrase.
 */
export function indexOfORP(word: string): number {
  let len = word.length;

  while (NON_WORD_RE.test(word[--len]));

  if (NON_WORD_RE.test(word[0])) len++;

  switch (++len) {
    case 0:
    case 1:
      return 0;
    case 2:
    case 3:
      return 1;
    default:
      return Math.trunc(len / 2) - 1;
  }
}

export type FocalPointComponent = HTMLSpanElement;

const view = create("span");
view.id = "fp";

export function FocalPoint(char: string): FocalPointComponent {
  // Don't clone; reuse the same node.
  view.textContent = char;
  return view;
}
