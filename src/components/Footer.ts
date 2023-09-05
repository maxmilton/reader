import './Footer.xcss';

import { compile } from 'stage1/macro' assert { type: 'macro' };
import { h } from 'stage1/runtime';
// import { interpolate } from '../macros' assert { type: 'macro' };
import { decodeEntities, removeNbsp } from '../macros' assert { type: 'macro' };

export type FooterComponent = HTMLElement;

// const meta = compile(
//   `
//     <footer>
//       © <a href=https://maxmilton.com class="normal muted" target=_blank>Max Milton</a> ・ v${process
//         .env
//         .APP_RELEASE!} ・ <a href=https://github.com/maxmilton/reader/issues target=_blank>report bug</a>
//     </footer>
//   `,
//   { keepSpaces: true },
// );
// const meta = compile(
//   // FIXME: This is a convoluted workaround for a bug in the bun macro system,
//   // where it crashes when doing string literal template interpolation. See:
//   // https://github.com/oven-sh/bun/issues/3830
//   interpolate(
//     `
//       <footer>
//         © <a href=https://maxmilton.com class="normal muted" target=_blank>Max Milton</a> ・ v%%1%% ・ <a href=https://github.com/maxmilton/reader/issues target=_blank>report bug</a>
//       </footer>
//     `,
//     [process.env.APP_RELEASE!],
//   ),
//   { keepSpaces: true },
// );
const meta = compile(
  // FIXME: This is an alternative workaround for the bun macro bug. See: https://github.com/oven-sh/bun/issues/3830
  decodeEntities(`
    <footer>
      &#169;&nbsp;<a href=https://maxmilton.com class="normal muted" target=_blank>Max Milton</a>&nbsp;&#12539; v${process.env.APP_RELEASE} &#12539;&nbsp;<a href=https://github.com/maxmilton/reader/issues target=_blank>report bug</a>
    </footer>
  `),
  // FIXME: Passing objects is also currently broken. See: https://github.com/oven-sh/bun/issues/3832
  // { keepSpaces: true },
);

export function Footer(): FooterComponent {
  // FIXME: Remove the removeNbsp macro once bun issue #3832 is fixed.
  return h<FooterComponent>(removeNbsp(meta.html));
  // return h<FooterComponent>(meta.html);
}
