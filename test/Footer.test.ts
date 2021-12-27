import { test } from 'uvu';
import * as assert from 'uvu/assert';
// import { Footer } from '../src/components/Footer';
import {
  cleanup, render, setup, teardown,
} from './utils';

type FooterComponent = typeof import('../src/components/Footer');

test.before(setup);
test.after(teardown);
test.after.each(cleanup);

test('renders correctly', () => {
  process.env.APP_RELEASE = '1.0.0';
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { Footer } = require('../src/components/Footer') as FooterComponent;
  const rendered = render(Footer());
  assert.fixture(
    rendered.container.innerHTML,
    `<footer class="mv2 muted fss tc">
© <a href="https://maxmilton.com" class="normal muted" target="_blank">Max Milton</a> ・ v1.0.0 ・ <a href="https://github.com/maxmilton/reader/issues" target="_blank">report bug</a>
</footer>`,
  );
});

test('has no node refs', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { Footer } = require('../src/components/Footer') as FooterComponent;
  const rendered = render(Footer());
  // @ts-expect-error - FIXME:!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert.is(rendered.container.firstChild._refs.length, 0);
});

test('contains a link to Github issues', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const { Footer } = require('../src/components/Footer') as FooterComponent;
  const rendered = render(Footer());
  assert.ok(
    rendered.container.querySelector(
      'a[href="https://github.com/maxmilton/reader/issues"]',
    ),
  );
});

test.run();
