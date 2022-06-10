import './ORP.xcss';

import { h, S1Node } from 'stage1';

type ORPComponent = S1Node & HTMLSpanElement;

const view = h('<span class=orp></span>');

export function ORP(char: string): ORPComponent {
  // Don't clone; reuse the same node.
  const root = view as ORPComponent;
  root.textContent = char;
  return root;
}
