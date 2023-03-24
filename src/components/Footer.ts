import { h, type S1Node } from 'stage1';

export type FooterComponent = S1Node & HTMLElement;

const view = h(`
  <footer class="mv2 muted fss tc">
    © <a href=https://maxmilton.com class="normal muted" target=_blank>Max Milton</a> ・ v${process
      .env
      .APP_RELEASE!} ・ <a href=https://github.com/maxmilton/reader/issues target=_blank>report bug</a>
  </footer>
`);

export function Footer(): FooterComponent {
  const root = view as FooterComponent;
  return root;
}
