import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { Footer } from '../src/components/Footer';
import { cleanup, render } from './utils';

test.after.each(cleanup);

test('renders correctly', async () => {
  process.env.APP_RELEASE = '1.0.0';

  // Reimport component to recompile view as it contains the release version
  // interpolated in its template string.
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { Footer } = (await import(
    `../src/components/Footer?x=${performance.now()}`
  )) as typeof import('../src/components/Footer');

  const rendered = render(Footer());
  assert.is(rendered.container.firstChild?.nodeName, 'FOOTER');
  assert.fixture(
    rendered.container.innerHTML,
    `<footer class="mv2 muted fss tc">
© <a href="https://maxmilton.com" class="normal muted" target="_blank">Max Milton</a> ・ v1.0.0 ・ <a href="https://github.com/maxmilton/reader/issues" target="_blank">report bug</a>
</footer>`,
  );
});

// TODO: Remove? Testing framework internals goes against the philosophy of
// testing user behaviour.
test('has no node refs', () => {
  const rendered = render(Footer());
  // @ts-expect-error - FIXME:!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  assert.is(rendered.container.firstChild._refs.length, 0);
});

test('contains a link to Github issues', () => {
  const rendered = render(Footer());
  assert.ok(
    rendered.container.querySelector('a[href="https://github.com/maxmilton/reader/issues"]'),
  );
});

test.run();
