import './Footer.xcss';

import { h } from 'stage1/fast';
import { compile } from 'stage1/macro' with { type: 'macro' };
import { interpolate } from '../macros.ts' with { type: 'macro' };

export type FooterComponent = HTMLElement;

const meta = compile(
  // FIXME: This is a convoluted workaround for a bug in the bun macro system,
  // where it crashes when doing string literal template interpolation. See:
  // https://github.com/oven-sh/bun/issues/3830
  interpolate(
    `
      <footer>
        © <a href=https://maxmilton.com class="normal muted" target=_blank>Max Milton</a> ・ v%%1%% ・ <a href=https://github.com/maxmilton/reader/issues target=_blank>report bug</a>
      </footer>
    `,
    [process.env.APP_RELEASE],
  ),
  { keepSpaces: true },
);

export function Footer(): FooterComponent {
  return h<FooterComponent>(meta.html);
}
